import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

// GET /api/products?category=regular|hajj
export async function getProducts(req: AuthRequest, res: Response) {
  try {
    const category = req.query.category as string | undefined;
    let query = `
      SELECT p.id, p.title, p.number_of_sold, p.rating, p.base_price, p.category,
             (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image
      FROM products p
    `;
    const params: any[] = [];

    if (category && (category === 'regular' || category === 'hajj')) {
      query += ' WHERE p.category = $1';
      params.push(category);
    }

    query += ' ORDER BY p.id ASC';

    const result = await pool.query(query, params);

    const products = result.rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      numberOfSold: row.number_of_sold,
      rating: parseFloat(row.rating),
      harga: row.base_price,
      image: row.image,
    }));

    return success(res, products);
  } catch (err) {
    console.error('GetProducts error:', err);
    return error(res, 'Server error', 500);
  }
}

// GET /api/products/:id
export async function getProductDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // Get product
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return error(res, 'Product not found', 404);
    }
    const product = productResult.rows[0];

    // Get images
    const imagesResult = await pool.query(
      'SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY sort_order',
      [id]
    );

    // Get variants (groups + options)
    const groupsResult = await pool.query(
      'SELECT id, name FROM product_variant_groups WHERE product_id = $1 ORDER BY id',
      [id]
    );

    const variants = [];
    for (const group of groupsResult.rows) {
      const optionsResult = await pool.query(
        'SELECT label, price_modifier FROM product_variant_options WHERE group_id = $1 ORDER BY id',
        [group.id]
      );
      variants.push({
        name: group.name,
        options: optionsResult.rows.map((o) => ({
          label: o.label,
          priceModifier: o.price_modifier,
        })),
      });
    }

    // Get specifications
    const specsResult = await pool.query(
      'SELECT label, value FROM product_specifications WHERE product_id = $1 ORDER BY id',
      [id]
    );

    const detail = {
      id: String(product.id),
      title: product.title,
      images: imagesResult.rows.map((r: any) => r.image_url),
      basePrice: product.base_price,
      stock: product.stock,
      variants,
      estimatedDelivery: product.estimated_delivery,
      specifications: specsResult.rows.map((s: any) => ({ label: s.label, value: s.value })),
      description: product.description,
      numberOfSold: product.number_of_sold,
      rating: parseFloat(product.rating),
      category: product.category,
    };

    return success(res, detail);
  } catch (err) {
    console.error('GetProductDetail error:', err);
    return error(res, 'Server error', 500);
  }
}

// GET /api/products/:id/reviews?page=1&limit=5&rating=&mediaOnly=false
export async function getProductReviews(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const ratingFilter = req.query.rating ? parseInt(req.query.rating as string) : null;
    const mediaOnly = req.query.mediaOnly === 'true';

    let whereClause = 'WHERE r.product_id = $1';
    const params: any[] = [id];
    let paramIdx = 1;

    if (ratingFilter) {
      paramIdx++;
      whereClause += ` AND r.rating = $${paramIdx}`;
      params.push(ratingFilter);
    }

    if (mediaOnly) {
      whereClause += ' AND EXISTS (SELECT 1 FROM review_images ri WHERE ri.review_id = r.id)';
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM reviews r ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get all reviews (for stats)
    const allReviewsResult = await pool.query(
      'SELECT rating FROM reviews WHERE product_id = $1',
      [id]
    );
    const allRatings = allReviewsResult.rows.map((r: any) => r.rating);
    const averageRating = allRatings.length > 0
      ? (allRatings.reduce((sum: number, r: number) => sum + r, 0) / allRatings.length).toFixed(1)
      : '0';

    const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allRatings.forEach((r: number) => { ratingCounts[r] = (ratingCounts[r] || 0) + 1; });

    // Get paginated reviews
    const offset = (page - 1) * limit;
    const reviewsResult = await pool.query(
      `SELECT r.id, r.rating, r.text, r.created_at, u.name, u.id as user_id
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIdx + 1} OFFSET $${paramIdx + 2}`,
      [...params, limit, offset]
    );

    // Get images for each review
    const reviews = [];
    for (const review of reviewsResult.rows) {
      const imagesResult = await pool.query(
        'SELECT image_url FROM review_images WHERE review_id = $1',
        [review.id]
      );

      // Generate avatar from name initials
      const nameParts = review.name.split(' ');
      const avatar = nameParts.length >= 2
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
        : review.name.substring(0, 2).toUpperCase();

      reviews.push({
        id: review.id,
        name: review.name,
        avatar,
        rating: review.rating,
        date: review.created_at.toISOString().split('T')[0],
        text: review.text,
        media: imagesResult.rows.map((img: any) => img.image_url),
      });
    }

    return success(res, {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating,
        totalReviews: allRatings.length,
        ratingCounts,
      },
    });
  } catch (err) {
    console.error('GetProductReviews error:', err);
    return error(res, 'Server error', 500);
  }
}

// GET /api/products/:id/related
export async function getRelatedProducts(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // Get the product to know its category
    const productResult = await pool.query('SELECT category FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return error(res, 'Product not found', 404);
    }

    const category = productResult.rows[0].category;

    // Get other products in same category, limit 5
    const result = await pool.query(
      `SELECT p.id, p.title, p.number_of_sold, p.rating, p.base_price,
              (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image
       FROM products p
       WHERE p.category = $1 AND p.id != $2
       ORDER BY RANDOM()
       LIMIT 5`,
      [category, id]
    );

    const products = result.rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      numberOfSold: row.number_of_sold,
      rating: parseFloat(row.rating),
      harga: row.base_price,
      image: row.image,
    }));

    return success(res, products);
  } catch (err) {
    console.error('GetRelatedProducts error:', err);
    return error(res, 'Server error', 500);
  }
}

// POST /api/products/:id/reviews — submit review with optional images
export async function createReview(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { rating, text } = req.body;

    if (!rating || !text) {
      return error(res, 'Rating and text are required');
    }

    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return error(res, 'Rating must be between 1 and 5');
    }

    // Check product exists
    const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (productCheck.rows.length === 0) {
      return error(res, 'Product not found', 404);
    }

    const reviewResult = await pool.query(
      'INSERT INTO reviews (product_id, user_id, rating, text) VALUES ($1, $2, $3, $4) RETURNING id',
      [id, userId, ratingNum, text]
    );

    const reviewId = reviewResult.rows[0].id;

    // Save review images if any
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      for (const file of files) {
        await pool.query(
          'INSERT INTO review_images (review_id, image_url) VALUES ($1, $2)',
          [reviewId, `/uploads/reviews/${file.filename}`]
        );
      }
    }

    return success(res, { reviewId }, 201);
  } catch (err) {
    console.error('CreateReview error:', err);
    return error(res, 'Server error', 500);
  }
}

// POST /api/products — create a new product (admin use, with image upload)
export async function createProduct(req: AuthRequest, res: Response) {
  try {
    const { title, basePrice, stock, estimatedDelivery, description, category } = req.body;

    if (!title || !basePrice) {
      return error(res, 'Title and basePrice are required');
    }

    const result = await pool.query(
      `INSERT INTO products (title, base_price, stock, estimated_delivery, description, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [title, basePrice, stock || 0, estimatedDelivery, description, category || 'regular']
    );

    const productId = result.rows[0].id;

    // Save uploaded images
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await pool.query(
          'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)',
          [productId, `/uploads/products/${files[i].filename}`, i]
        );
      }
    }

    return success(res, { productId }, 201);
  } catch (err) {
    console.error('CreateProduct error:', err);
    return error(res, 'Server error', 500);
  }
}
