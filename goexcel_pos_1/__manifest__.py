# See LICENSE file for full copyright and licensing details.
{
    "name": "GoExcel POS 1",
    "version": "12.0.1",
    "category": "Sale",
    "license": 'OPL-1',
    "summary": "POS Update",
    "description": """Modifies POS features and UI
    > Sort product with order_number field
    > Cancel pos order
    """,

    # Author
    "author": "Excelroot Technology Sdn Bhd",
    "website": "https://www.excelroot.com/",

    # Dependencies
    "depends": [
        'base',
        'point_of_sale',
        'product'
    ],

    # Data
    "data": [
        'views/pos_order.xml',
        'views/product_product.xml',
        'views/product_template.xml',
    ],

    # Odoo App Store Specific
    'images': ['static/description/icon.png'],

    # Technical
    "installable": True,

}

