odoo.define('point_of_sale.CustomPosWidget', function (require) {
    "use strict";
    var utils = require('web.utils');
    var round_pr = utils.round_precision;

    var PosBaseWidget = require('point_of_sale.BaseWidget');

    // Use include to add methods to existing PosBaseWidget class
    PosBaseWidget.include({
        // Set the template, if necessary
        template: 'CustomPosBaseWidget',
        format_currency_front: function(amount,precision) {
            var currency = (this.pos && this.pos.currency) ? this.pos.currency : {symbol:'$', position: 'after', rounding: 0.01, decimals: 2};
            amount = this.format_currency_no_symbol(amount,precision);
//     Yulia 17012025 RM100 no space between currency and price
          return (currency.symbol || '') + amount;
        },
        get_quantity_no_dp:function(unit){
            return parseInt(unit)
        },
        calc_discount_item(price_unit,before_disc_amount){
         let discountedAmount = (price_unit * (100 - before_disc_amount)) / 100;

          return this.format_currency_front(discountedAmount,0)
        },
//      Yulia 18012025 get 15 chars of product name
        get_15_char_product(name){
            return name.substring(0, 15)
        },
        after_discount_price(qty,totalPrice){
            let discountedAmount = totalPrice / qty;

            if(discountedAmount == 1){
              return this.format_currency_front(discountedAmount , 0);
            }else{
                 let nearestPrice = Math.ceil(discountedAmount * 20) / 20;

            // Return the formatted price using format_currency_front
            return this.format_currency_front(discountedAmount , 0);
            }
        }
    });

    return PosBaseWidget;
});