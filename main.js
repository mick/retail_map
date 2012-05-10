$(function(){
    var geocoder = new google.maps.Geocoder();

    var mapstyle = [{
        featureType: "all",
        stylers: [
            { saturation: -80 }
        ]}];

     var myOptions = {
         center: new google.maps.LatLng(-34.397, 150.644),
         zoom: 8,
         mapTypeId: google.maps.MapTypeId.ROADMAP,
         styles:mapstyle
     };

    var map = new google.maps.Map($("#map")[0],
                                  myOptions);

    $("#search").click(function(){
        var zipcode = $("#zipcode").val();
        geocoder.geocode( { 'address': zipcode}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                var marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location
                });
            } else {
                alert("Geocode was not successful for the following reason: " + status);
            }
        });
    });


});