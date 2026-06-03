# -*- coding: utf-8 -*-
#################################################################################
#
#   Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#    See LICENSE file for full copyright and licensing details.
#################################################################################

{
    "name"          :  "Print Direct: Direct Printing from Desktop, Mobile, Android & iOS",
    "summary"       :  """CUSTOM: Effortlessly print any type of report, PDF, shipping label, ZPL, or ESC/POS on any printer— local, thermal, Zebra, remote, Wi-Fi, or Bluetooth — no downloads, no annoying pop-ups, and no printing limitations!
                    Print Direct : Single Click Print
Keywords: Zebra Print | Wi-Fi Printer for Odoo | Print Reports from Odoo | Odoo Direct Print Pro | Thermal Print | Shipping Print | Automated Print Workflow | Print Custom Labels | Odoo Label Printing | Direct Print Cloud Service | Smart Print Solution | Direct Print | Print Labels from Odoo | Receipt Printer | Print Using Cloud Service | Print Automation for Odoo | Multi-device Print | ERP Printing Solution | Remote Printer Access | Print Directly from Odoo | Cloud Printing for Odoo | Print ZPL from Odoo | Local Printer Integration | Invoice Print | Barcode Print | Print Directly | Bluetooth Printer for Odoo | On-demand Print | Print Shipping Labels in Odoo | IoTBox Free Print | Odoo Print | Fast Printing from Odoo | Automated Printing | ESC/POS Print | ZPL Label Print | Direct Print Integration | Shipping Label Printing from Odoo | Cloud Print | Print Without Downloading PDF | Seamless Printing Integration | Print Without Downloading | Odoo Print Module | Print Custom Labels | Plug-and-play Print | Print Reports from Odoo | Odoo to Cloud Printer | Printer Integration | Print Directly without Downloading | PrintNode Alternative | Print Automation for Odoo | Quick Print | Bluetooth Print | Direct Print Pro | Odoo Printing Solution | Print Shipping Labels in Odoo | Wireless and Bluetooth Printer Support | IoT Printing Solution | Seamless Print | Printer Connection | Print Custom Labels | Print ZPL from Odoo | Odoo Direct Print | Shipping Print | Network Print | Print Integration | Remote Printing | Mobile Printing | Android Printing | Tablet Printing | Print from Mobile | Remote Mobile Print | Cloud Printing on Mobile | Mobile Printing Solution | escpos
                    """,
    "category"      :  "Extra Tools",
    "version"       :  "3.0.4",
    "sequence"      :   1,
    "author"        :  "Webkul Software Pvt. Ltd.",
    "license"       :  "Other proprietary",
    "website"       :  "https://store.webkul.com/odoo-direct-print.html",
    "description"   :  """ Odoo Print Direct streamlines printing in Odoo by directly sending commands 
    to printers, cutting out the need for additional hardware. It's compatible with Windows and Linux, 
    automatically finds connected printers, and supports various printer types. With no requirement 
    for IoT or POS devices, it's a cost-effective solution for businesses. Odoo Direct Print
                    """,
    "live_test_url" :  "https://odoodemo.webkul.in/demo_feedback?module=wk_odoo_direct_print",
    "depends"       :  ['base', 'account', 'sale', 'sale_management', 'mail', 'stock','purchase'],
    "data"          :  [
        'security/ir.model.access.csv',
        'report/receipt_template.xml',
        'report/qweb_report.xml',
        
        'data/host_sys_info_cron.xml',
        'data/clean_print_jobs_cron.xml',
        'data/renotify_queued_jobs.xml',
        'data/default_printer.xml',
        'data/report_triger_rule.xml',
        'data/autoprint_rule_data.xml',
        
        'views/printer.xml',
        'views/hostmachine.xml',
        'views/print_jobs.xml',
        'views/default_printer.xml',
        'views/stock_picking.xml',
        'views/ir_actions_report.xml',
        'views/autoprint_rule.xml',
        'views/assets.xml',
        'views/res_config.xml',
        
        'wizard/printer_test.xml',
    ],
    "demo":[
    ],
    
    'qweb': [
        "static/src/attachment/attachment.xml",
        "static/src/printer/printer.xml",
    ],

    "images":  ['static/description/Banner.gif'],
    "application"   :  True,
    "installable"   :  True,
    "price"         :  149,
    "currency"      :  "USD",
    "pre_init_hook" :  "pre_init_check",
}
