google.load('visualization', '1');
$(function(){
    var geocoder = new google.maps.Geocoder();
    var mapstyle = [{
        featureType: "all",
        stylers: [
            { saturation: -50 }
        ]}];

    var myOptions = {
        zoom: 4,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles:mapstyle,
        mapTypeControl: false,
        streetViewControl: false,
        panControl:false,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
        }
    };
    var map = new google.maps.Map($("#map")[0], myOptions);

    // Fit the USA on the map, no matter the size/zoom.
    var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(50,-110),new google.maps.LatLng( 20, -80));
    map.fitBounds(bounds);
    
    $("form").submit(function(e){
        e.preventDefault();
        $(this).find(".search").click();
    });


    var infoWindow = new google.maps.InfoWindow();
    
    // Send query to Google Chart Tools to get data from table.
    // Note: the Chart Tools API returns up to 500 rows.
    var query = "SELECT * FROM 1JVFdZ_-2xKLlD9RQjdzn61d4DzXMjYeZht8jh4c";
    query = encodeURIComponent(query);
    var gvizQuery = new google.visualization.Query(
        'http://www.google.com/fusiontables/gvizdata?tq=' + query);

    var createMarker = function(coordinate, formatedaddress, address, phonenum) {
        var marker = new google.maps.Marker({
            map: map,
            position: coordinate,
            icon: new google.maps.MarkerImage('images/orbotixMapPin.png')
        });
        google.maps.event.addListener(marker, 'click', function(event) {
            infoWindow.setPosition(coordinate);
            var url = "https://maps.google.com/maps?q=" + encodeURIComponent(address);
            infoWindow.setContent("<div class='infowindow'><h4>Brookstone</h4>"+
                                  "<a target='_blank' "+
                                  "href='"+url+"'>"+formatedaddress+"</a><div>"+phonenum+"</div></div>");
            google.maps.event.addDomListenerOnce(infoWindow, "domready", function(){
                // hack to get google to have rounder corners on info windows.
                $(".infowindow").parent().parent().parent().siblings().css("border-radius", "10px");               
            })
            infoWindow.open(map);
        });
    };
    points = [];
    gvizQuery.send(function(response) {
        var numRows = response.getDataTable().getNumberOfRows();
        
        // For each row in the table, create a marker
        for (var i = 0; i < numRows; i++) {         
            var lat = response.getDataTable().getValue(i, 7);
            var lng = response.getDataTable().getValue(i, 8);
            var coordinates = new google.maps.LatLng(lat, lng);
            var store = response.getDataTable().getValue(i, 1);
            points.push({coordinates:coordinates, address:response.getDataTable().getValue(i, 6)})
            createMarker(coordinates, response.getDataTable().getValue(i, 5)+"<br />"+
                         response.getDataTable().getValue(i, 4)+", "+
                         response.getDataTable().getValue(i, 3)+" "+
                         response.getDataTable().getValue(i, 2),
                         response.getDataTable().getValue(i, 6), response.getDataTable().getValue(i, 10));
            addToList(coordinates, response.getDataTable().getValue(i, 6), response.getDataTable().getValue(i, 9), response.getDataTable().getValue(i, 10))
        }
    });

    var addToList = function(coords, address, locationType, phonenum){

        if(address == "")
            return;
        var url = "https://maps.google.com/maps?q=" + encodeURIComponent(address);
        var row = '<li>'+
            '<span class="name">Brookstone</span>'+
            '<span class="address"><a href="'+url+'" target="_blank">'+address+'</a></span>' +
            '<span class="phonenumber">'+phonenum+'</span>'+
            '</li>';
        if(locationType == "mall")
            $("#malls").append(row);
        else
            $("#airports").append(row);


    }
    $("div#storelist div.close").click(function(){
        $("div#storecontainer").fadeOut('fast');
    })
    $("div.viewstorelist").live("click",function(){
        $("div#storecontainer").fadeIn('fast');
    })

    $(".search").click(function(){
        dismissModal();
        var zipcode = $(this).parents(".locator").find(".zipcode").val();
        if(supports_storage()){
            localStorage.setItem("zipcode", zipcode);
        }
        geocoder.geocode( { 'address': zipcode}, function(results, status) {
            setZipCode(zipcode);
            if (status == google.maps.GeocoderStatus.OK) {
                getNearestStore(results[0].geometry.location);

            }
        });
    });

    var getNearestStore = function(location){

        var query = "SELECT * FROM 1JVFdZ_-2xKLlD9RQjdzn61d4DzXMjYeZht8jh4c ORDER BY ST_DISTANCE(latitude, LATLNG"+location.toString()+") LIMIT 1";
        query = encodeURIComponent(query);
        var gvizQuery = new google.visualization.Query(
            'http://www.google.com/fusiontables/gvizdata?tq=' + query);
        
        gvizQuery.send(function(response) {
            var numRows = response.getDataTable().getNumberOfRows();
            
            var coord = new google.maps.LatLng(response.getDataTable().getValue(0,7),
                                               response.getDataTable().getValue(0,8));
            
            var bounds = new google.maps.LatLngBounds()
            bounds.extend(coord);
            bounds.extend(location);
            map.fitBounds(bounds);
        });
    }
    var userLocation = function(location) {
        dismissModal();
        setZipCode();
        $("#location").html('Using current location <div class="btn" id="changelocation">Change</div><div class="viewstorelist">View Store List</div>');
        getNearestStore(new google.maps.LatLng(location.coords.latitude, location.coords.longitude));
    }
    if(navigator.geolocation){  
        navigator.geolocation.getCurrentPosition(userLocation);
    }

    $("#changelocation").live("click", function(){
        $("#location").fadeOut('fast', function(){
            $("header .locator").fadeIn("fast");
            $("header .locator input").focus();
        })
    })

    var setZipCode = function(zipcode){
        $("#location").html('Viewing stores near <span>'+zipcode+'</span> <div class="btn" id="changelocation">Change</div><div class="viewstorelist">View Store List</div>');
        $("header .locator").fadeOut('fast', function(){
            $("#location").fadeIn('fast');
        })

    };

    $(document).keydown(function(e){
        console.log(e)
        if(e.keyCode == 27){
            dismissModal();
        }
    })
    
    var dismissModal = function(){
        $("#modalcontainer").fadeOut();
        $("#storecontainer").fadeOut();
    };
    $("#modalmessage .locator input").focus();

    var supports_storage = function() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }

    if(supports_storage() && !navigator.geolocation){
        var zipcode = localStorage.getItem("zipcode");
        if(zipcode){
            $(".zipcode").val(zipcode);
            $("header .search").click();
        }
    }
            



});
