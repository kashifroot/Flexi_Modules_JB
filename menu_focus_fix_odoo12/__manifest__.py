{
    'name': 'Menu Focus Fix (Odoo 12)',
    'version': '12.0.1.0.0',
    'category': 'Web',
    'summary': 'Remove autofocus from menu search and focus app menu',
    'depends': ['web'],
    'data': [
	    'views/views.xml',
	    
    ],
    'qweb': [],
    'installable': True,
    'application': False,
    'assets': {
        'web.assets_backend': [
            'menu_focus_fix_odoo12/static/src/js/menu_focus.js',
        ],
    },
}
