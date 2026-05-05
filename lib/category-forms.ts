// Category-specific form configurations for Pakistani market

export const PAKISTANI_SIZES = {
  MEN: ['Small', 'Medium', 'Large', 'XL', 'XXL', 'XXXL', 'Custom'],
  WOMEN: ['XS', 'Small', 'Medium', 'Large', 'XL', 'XXL', 'XXXL', 'Custom'],
  UNISEX: ['Small', 'Medium', 'Large', 'XL', 'XXL', 'Custom'],
}

export const PAKISTANI_FABRICS = {
  MEN: [
    'Cotton',
    'Linen',
    'Khaddar',
    'Cambric',
    'Voile',
    'Poplin',
    'Chambray',
    'Denim',
    'Twill',
    'Canvas',
    'Corduroy',
    'Wool',
    'Blend',
  ],
  WOMEN: [
    'Lawn',
    'Cotton',
    'Linen',
    'Khaddar',
    'Cambric',
    'Voile',
    'Organza',
    'Chiffon',
    'Georgette',
    'Silk',
    'Satin',
    'Velvet',
    'Brocade',
    'Embroidered',
  ],
  HOME: [
    'Cotton',
    'Polyester',
    'Cotton Blend',
    'Linen',
    'Microfiber',
    'Bamboo',
    'Silk',
    'Satin',
  ],
}

export const PAKISTANI_COLORS = [
  'White',
  'Black',
  'Navy Blue',
  'Beige',
  'Cream',
  'Brown',
  'Grey',
  'Maroon',
  'Burgundy',
  'Olive',
  'Khaki',
  'Pastel Pink',
  'Pastel Blue',
  'Pastel Green',
  'Pastel Yellow',
  'Peach',
  'Sky Blue',
  'Turquoise',
  'Purple',
  'Red',
  'Green',
  'Yellow',
  'Orange',
  'Pink',
  'Multi Color',
  'Printed',
]

export const CARE_INSTRUCTIONS = [
  'Machine Wash Cold',
  'Hand Wash Only',
  'Dry Clean Only',
  'Do Not Bleach',
  'Tumble Dry Low',
  'Line Dry',
  'Iron on Low Heat',
  'Do Not Iron',
]

export function getCategoryFormType(categorySlug: string): string {
  const formMap: Record<string, string> = {
    // Men's categories
    'men-unstitched': 'men-unstitched',
    'men-stitched': 'men-stitched',
    'men-formal-wear': 'men-formal',
    'men-semi-formal': 'men-semi-formal',
    'men-winter-wear': 'men-winter',
    
    // Women's categories
    'women-unstitched': 'women-unstitched',
    'women-stitched-pret': 'women-stitched',
    'women-formal-luxury': 'women-formal',
    'women-bottoms-dupattas': 'women-bottoms',
    
    // Home Essentials
    'bed-sheets': 'bed-sheets',
    'quilt-comforters': 'quilt-comforters',
    'pillow-cushion-covers': 'pillow-covers',
    'blankets': 'blankets',
    'towels-bath': 'towels',
    'curtains-mats': 'curtains',
  }
  
  return formMap[categorySlug] || 'default'
}

