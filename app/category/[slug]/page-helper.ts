import { sql } from "@/lib/db"

export async function getCategoryProducts(
  categoryId: string,
  isParentCategory: boolean,
  sortBy: string,
  limit: number,
  offset: number
) {
  // Build ORDER BY clause as string
  let orderBy: string
  switch (sortBy) {
    case "price-low":
      orderBy = "COALESCE(p.sale_price, p.price) ASC"
      break
    case "price-high":
      orderBy = "COALESCE(p.sale_price, p.price) DESC"
      break
    case "newest":
      orderBy = "p.created_at DESC"
      break
    case "oldest":
      orderBy = "p.created_at ASC"
      break
    case "name-asc":
      orderBy = "p.name ASC"
      break
    case "name-desc":
      orderBy = "p.name DESC"
      break
    default:
      orderBy = "p.featured DESC, p.created_at DESC"
  }

  // Use separate queries based on parent category and sort
  if (isParentCategory) {
    switch (sortBy) {
      case "price-low":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id IN (
            SELECT id FROM categories 
            WHERE id = ${categoryId} OR parent_id = ${categoryId}
          ) AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      case "price-high":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id IN (
            SELECT id FROM categories 
            WHERE id = ${categoryId} OR parent_id = ${categoryId}
          ) AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      case "newest":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id IN (
            SELECT id FROM categories 
            WHERE id = ${categoryId} OR parent_id = ${categoryId}
          ) AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      case "oldest":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id IN (
            SELECT id FROM categories 
            WHERE id = ${categoryId} OR parent_id = ${categoryId}
          ) AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.created_at ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      case "name-asc":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id IN (
            SELECT id FROM categories 
            WHERE id = ${categoryId} OR parent_id = ${categoryId}
          ) AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.name ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      case "name-desc":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id IN (
            SELECT id FROM categories 
            WHERE id = ${categoryId} OR parent_id = ${categoryId}
          ) AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.name DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      default:
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id IN (
            SELECT id FROM categories 
            WHERE id = ${categoryId} OR parent_id = ${categoryId}
          ) AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.featured DESC, p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
    }
  } else {
    // Subcategory queries
    switch (sortBy) {
      case "price-low":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id = ${categoryId} AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      case "price-high":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id = ${categoryId} AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      case "newest":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id = ${categoryId} AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      case "oldest":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id = ${categoryId} AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.created_at ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      case "name-asc":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id = ${categoryId} AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.name ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      case "name-desc":
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id = ${categoryId} AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.name DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      default:
        return sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE pc.category_id = ${categoryId} AND p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.featured DESC, p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
    }
  }
}

