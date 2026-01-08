odoo.define('flexi_mobile_ui.chrome', function (require) {
    let chrome = require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    chrome.OrderSelectorWidget.include({
        last_shown: 0,
        yet_to_render: 0,
        init: function (parent, options) {
            this._super(parent, options);
        },
        renderElement: function () {
            let self = this;
            this._super();
            let toggleBtn = this.$('.toggle_btn:first');
            toggleBtn.click(function (event) {
                console.log('Click code update 1');
                let toggle_sign = toggleBtn.find('i'); // Select the icon within .toggle_btn
                $(this).parent().toggleClass('switched_on'); // Toggle class on parent .order-selector
                toggle_sign.toggleClass('fa-toggle-on fa-toggle-off'); // Toggle icon classes
                if ($(this).parent().hasClass('switched_on')) {
                    self.last_shown = 1;
                }
                else {
                    self.last_shown = 0;
                }
            });
            if (this.yet_to_render) {
                self.yet_to_render = 0;
                if (window.innerWidth <= 991) {
                    self.last_shown = 1;
                }
            }

            if (!self.last_shown) {
                toggleBtn.click();
            }
        }
    });
})
