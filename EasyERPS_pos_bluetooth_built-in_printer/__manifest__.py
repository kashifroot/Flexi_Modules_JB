# -*- coding: utf-8 -*-
{
    'name': "POS Bluetooth/Built-in Printer",
    'support': "support@easyerps.com",
    'license': "OPL-1",
    'price': 200,
    'currency': "USD",
    'summary': """
        This module Allows you to print POS receipts directly using Bluetooth, Built-in, USB or IP Printer on SUNMI/Android devices
        """,
    'author': "EasyERPS",
    'website': "https://EasyERPS.com",
    'category': 'Point of Sale',
    'version': '12.1.2',
    'depends': ['base', 'point_of_sale'],
    'data': [
        'views/views.xml',
        'views/assets.xml',
    ],
    
    'qweb': [
        'static/src/xml/pos.xml',
    ],

    'images': ['images/main_screenshot.png'],
}
