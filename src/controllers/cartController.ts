import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/response';

// GET /api/cart — get all cart items for the logged-in user
export async function getCart(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      `SELECT c.product_id, c.quantity, c.selected, c.selected_variants,
              p.title, p.number_of_sold, p.rating, p.base_price,
              (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.userId]
    );

    // For each cart item, get variant groups so the frontend can show variant selectors
    const items = [];
    for (const row of result.rows) {
      // Get variant groups for this product
      const groupsResult = await pool.query(
        'SELECT id, name FROM product_variant_groups WHERE product_id = $1 ORDER BY id',
        [row.product_id]
      );

      const variantGroups = [];
      for (const group of groupsResult.rows) {
        const optionsResult = await pool.query(
          'SELECT label, price_modifier FROM product_variant_options WHERE group_id = $1 ORDER BY id',
          [group.id]
        );
        variantGroups.push({
          name: group.name,
          options: optionsResult.rows.map((o: any) => ({
            label: o.label,
            priceModifier: o.price_modifier,
          })),
        });
      }

      // Calculate harga based on selected variants
      const selectedVariants = row.selected_variants || {};
      let harga = row.base_price;
      for (const group of variantGroups) {
        const idx = selectedVariants[group.name] ?? 0;
        harga += group.options[idx]?.priceModifier ?? 0;
      }

      items.push({
        id: String(row.product_id),
        title: row.title,
        numberOfSold: row.number_of_sold,
        rating: parseFloat(row.rating),
        harga,
        image: row.image,
        quantity: row.quantity,
        selected: row.selected,
        selectedVariants: selectedVariants,
        variantGroups,
        basePrice: row.base_price,
      });
    }

    return success(res, items);
  } catch (err) {
    console.error('GetCart error:', err);
    return error(res, 'Server error', 500);
  }
}

// POST /api/cart — add item to cart
export async function addToCart(req: AuthRequest, res: Response) {
  try {
    const { productId, selectedVariants } = req.body;

    if (!productId) {
      return error(res, 'productId is required');
    }

    // Check product exists
    const productCheck = await pool.query('SELECT id, stock FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return error(res, 'Product not found', 404);
    }

    // Check if already in cart
    const existing = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.userId, productId]
    );

    if (existing.rows.length > 0) {
      // Increment quantity
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + 1, updated_at = NOW() WHERE id = $1',
        [existing.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO cart_items (user_id, product_id, quantity, selected, selected_variants)
         VALUES ($1, $2, 1, true, $3)`,
        [req.userId, productId, JSON.stringify(selectedVariants || {})]
      );
    }

    return success(res, { message: 'Added to cart' });
  } catch (err) {
    console.error('AddToCart error:', err);
    return error(res, 'Server error', 500);
  }
}

// PUT /api/cart/:productId — update cart item
export async function updateCartItem(req: AuthRequest, res: Response) {
  try {
    const { productId } = req.params;
    const { quantity, selected, selectedVariants } = req.body;

    const existing = await pool.query(
      'SELECT id FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.userId, productId]
    );

    if (existing.rows.length === 0) {
      return error(res, 'Cart item not found', 404);
    }

    const updates: string[] = [];
    const params: any[] = [];
    let idx = 0;

    if (quantity !== undefined) {
      idx++;
      updates.push(`quantity = $${idx}`);
      params.push(quantity);
    }
    if (selected !== undefined) {
      idx++;
      updates.push(`selected = $${idx}`);
      params.push(selected);
    }
    if (selectedVariants !== undefined) {
      idx++;
      updates.push(`selected_variants = $${idx}`);
      params.push(JSON.stringify(selectedVariants));
    }

    if (updates.length === 0) {
      return error(res, 'No fields to update');
    }

    updates.push('updated_at = NOW()');

    idx++;
    params.push(req.userId);
    idx++;
    params.push(productId);

    await pool.query(
      `UPDATE cart_items SET ${updates.join(', ')} WHERE user_id = $${idx - 1} AND product_id = $${idx}`,
      params
    );

    return success(res, { message: 'Cart item updated' });
  } catch (err) {
    console.error('UpdateCartItem error:', err);
    return error(res, 'Server error', 500);
  }
}

// DELETE /api/cart/:productId — remove item from cart
export async function removeFromCart(req: AuthRequest, res: Response) {
  try {
    const { productId } = req.params;

    await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [req.userId, productId]
    );

    return success(res, { message: 'Removed from cart' });
  } catch (err) {
    console.error('RemoveFromCart error:', err);
    return error(res, 'Server error', 500);
  }
}

// DELETE /api/cart — clear entire cart
export async function clearCart(req: AuthRequest, res: Response) {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.userId]);
    return success(res, { message: 'Cart cleared' });
  } catch (err) {
    console.error('ClearCart error:', err);
    return error(res, 'Server error', 500);
  }
}
