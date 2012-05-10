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

    $("form").submit(function(e){
        e.preventDefault();
        $("#search").click();
    });

    var image = 'orbotixMapPin.png';

    $("#search").click(function(){
        var zipcode = $("#zipcode").val();
        geocoder.geocode( { 'address': zipcode}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);

                for(var i =0; i<5; i++){
                    lat = results[0].geometry.location.lat()+ (Math.random());
                    lat = lat- (Math.random());
                    lng = results[0].geometry.location.lng()+ (Math.random());
                    lng = lng- (Math.random());
                    
                    var loc = new google.maps.LatLng(lat, lng);
                    
                    var marker = new google.maps.Marker({
                        map: map,
                        position: loc,
                        icon:image
                    });
                    

                }




            } else {
                alert("Geocode was not successful for the following reason: " + status);
            }
        });
    });


});