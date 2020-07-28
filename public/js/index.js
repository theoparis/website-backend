$(function() {
    /**
     * Jquery code to insert header code into a blank <header> tag.
     *
     * Using ejs now, this is not needed!
     */
    // $("header").load("/components/header");

    // Feather Icons
    setTimeout(() => feather.replace(), 500)
    $('#brand-name').hover(
        function() {
            $(this).addClass('animated tada')
        },
        function() {
            $(this).removeClass('animated tada')
        }
    )
    $('.navlink').hover(
        function() {
            $(this).addClass('animated rubberBand')
        },
        function() {
            $(this).removeClass('animated rubberBand')
        }
    )

    $('.box a').click(function(event) {
        event.preventDefault()
        $(this).parent().parent().toggleClass('link-clicked')
        let duration = 1
        gsap.to('.link-clicked', { duration, scale: 0.01, ease: 'expo' })
        setTimeout(() => {
            window.location.href = $(this).attr('href')
        }, (duration) * 1000)
    })

    if ($('#error')) $('#error').fadeOut(5000)
})