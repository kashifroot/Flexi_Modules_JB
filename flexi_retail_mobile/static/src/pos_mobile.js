$(function(){

    $('#pos-left-sidebar-container .menu_toggle').click(function(){
        console.log($('#left-sidebar-content').length, 'left bard');
        $('#left-sidebar-content').toggleClass('hidden');
        $(this).find('i').toggleClass('fa fa-chevron-right fa fa-chevron-left');
    });

    let ww = window.innerWidth;
    let min_width = Math.min(ww, 991);
    let is_small_screen = Math.min(ww, 991) == ww;
    if(is_small_screen){
        if(!$('#left-sidebar-content').hasClass('hidden')){
            $('#left-sidebar-content').toggleClass('hidden');
        }
    }
    else{
        $('#pos-left-sidebar-container i').removeClass('fa-chevron-left').removeClass('fa-chevron-right');
        $('#pos-left-sidebar-container i').addClass('fa-chevron-left');
    }
})