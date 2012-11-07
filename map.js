google.load('visualization', '1');

var spheroMap = {
  
  createMarker:function(coordinate, formatedaddress, locationType, address, phonenum, airportname, company) {
    var marker = new google.maps.Marker({
      map: spheroMap.map,
      position: coordinate,
      icon: new google.maps.MarkerImage('images/orbotixMapPin.png')
    });
    var name = company;
    if(locationType == "airport")
      name = company +" at " + airportname;
    google.maps.event.addListener(marker, 'click', function(event) {
      spheroMap.infoWindow.setPosition(coordinate);
      var url = "http://maps.google.com/maps?saddr=&daddr=" + encodeURIComponent(address);
      spheroMap.infoWindow.setContent("<div class='infowindow'><h4>"+name+"</h4>"+
                                      "<a target='_blank' "+
                                      "href='"+url+"'>"+formatedaddress+"</a><div>"+phonenum+"</div></div>");
      google.maps.event.addDomListenerOnce(spheroMap.infoWindow, "domready", function(){
        // hack to get google to have rounder corners on info windows.
        $(".infowindow").parent().parent().parent().siblings().css("border-radius", "10px");               
      });
      spheroMap.infoWindow.open(spheroMap.map);
    });
  },
  points:[],
  loadPoints:function(){
    // Send query to Google Chart Tools to get data from table.
    // Note: the Chart Tools API returns up to 500 rows.
    var query = "SELECT * FROM 1fJjnZCwJfRpBkNk4pXyHFBBUmlnktlt4-PZ600Q where Name NOT EQUAL TO 'Target'";
    query = encodeURIComponent(query);
    // http://www.google.com/fusiontables/gvizdata?tq=SELECT * FROM 1fJjnZCwJfRpBkNk4pXyHFBBUmlnktlt4-PZ600Q
    var gvizQuery = new google.visualization.Query(
      'http://www.google.com/fusiontables/gvizdata?tq=' + query);

    gvizQuery.send(function(response) {
      var numRows = response.getDataTable().getNumberOfRows();
      
      /*
        Old table:
        0: Store number
        1: Store Name
        2: Zip
        3: State
        4: City
        5: Street Address
        6: Formatted Address
        7: Lat
        8: Long
        9: Location Type
        10: Phone
        11: Airport Name
        12: Company

        New Table
        0: Company
        1: Store Name
        2: Formatted Address
        3: Street Address
        4: City
        5: State
        6: Zip
        7: Phone
        8: Lat
        9: Long
      */
      // For each row in the table, create a marker
      for (var i = 0; i < numRows; i++) {         
        var lat = response.getDataTable().getValue(i, 9);
        var lng = response.getDataTable().getValue(i, 8);
        var coordinates = new google.maps.LatLng(lat, lng);
        var store = response.getDataTable().getValue(i, 1);
        spheroMap.points.push({coordinates:coordinates, address:response.getDataTable().getValue(i, 2)})
        spheroMap.createMarker(coordinates, response.getDataTable().getValue(i, 3)+"<br />"+
                     response.getDataTable().getValue(i, 4)+", "+
                     response.getDataTable().getValue(i, 5)+" "+
                     response.getDataTable().getValue(i, 6),
                     'notairport',
                     response.getDataTable().getValue(i, 2), 
                     response.getDataTable().getValue(i, 7), 
                     'none',
                     response.getDataTable().getValue(i, 0));
        spheroMap.addToList(coordinates, response.getDataTable().getValue(i, 2), 
                  'notairport', 
                  response.getDataTable().getValue(i, 7),
                  'none',
                  response.getDataTable().getValue(i, 0));
      }
    });
  },
  addToList:function(coords, address, locationType, phonenum, airportname, company){

    if(address == "")
      return;
    var url = "http://maps.google.com/maps?saddr=&daddr=" + encodeURIComponent(address);
    var name = company;

    var row = '<li>'+
      '<span class="name">'+name+'</span>'+
      '<span class="address"><a href="'+url+'" target="_blank">'+address+'</a></span>' +
      '<span class="phonenumber">'+phonenum+'</span>'+
      '</li>';

    $("#stores").append(row);
  },
  

  setupEvents:function(){

    $("div#storelist div.close").click(function(){
      $("div#storecontainer").fadeOut('fast');
    })
    $("div.viewstorelist").live("click",function(){
      $("div#storecontainer").fadeIn('fast');
    })
    
    $(".search").click(function(){
      spheroMap.dismissModal();
      var zipcode = $(this).parents(".locator").find(".zipcode").val();
      if(spheroMap.supports_storage()){
        localStorage.setItem("zipcode", zipcode);
      }
      spheroMap.geocoder.geocode( { 'address': zipcode}, function(results, status) {
        spheroMap.setZipCode(zipcode);
        if (status == google.maps.GeocoderStatus.OK) {
          spheroMap.getNearestStore(results[0].geometry.location);
        }
      });
    });

    if(navigator.geolocation){  
        navigator.geolocation.getCurrentPosition(spheroMap.userLocation);
    }

    $("#changelocation").live("click", function(){
        $("#location").fadeOut('fast', function(){
            $("header .locator").fadeIn("fast");
            $("header .locator input").focus();
        })
    });
    $("form").submit(function(e){
      e.preventDefault();
      $(this).find(".search").click();
    });

  },
  getNearestStore:function(location){

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
      spheroMap.map.fitBounds(bounds);
    });
    $(document).keydown(function(e){
        if(e.keyCode == 27){
            dismissModal();
        }
    });
    $("#modalmessage .locator input").focus();
  },
  userLocation:function(location) {
    spheroMap.dismissModal();
    spheroMap.setZipCode();
    $("#location").html('Using current location <div class="btn" id="changelocation">Change</div><div class="viewstorelist">View Store List</div>');
    spheroMap.getNearestStore(new google.maps.LatLng(location.coords.latitude, location.coords.longitude));
  },

  setZipCode:function(zipcode){
    $("#location").html('Viewing stores near <span>'+zipcode+'</span> <div class="btn" id="changelocation">Change</div><div class="viewstorelist">View Store List</div>');
    $("header .locator").fadeOut('fast', function(){
      $("#location").fadeIn('fast');
    })
  },
    
  dismissModal:function(){
    $("#modalcontainer").fadeOut();
    $("#storecontainer").fadeOut();
  },
  supports_storage: function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  },
  init:function(){

    spheroMap.geocoder = new google.maps.Geocoder();
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
    spheroMap.map = new google.maps.Map($("#map")[0], myOptions);

    // Fit the USA on the map, no matter the size/zoom.
    var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(50,-110),new google.maps.LatLng( 20, -80));
    spheroMap.map.fitBounds(bounds);
    


    spheroMap.infoWindow = new google.maps.InfoWindow();
    
    if(spheroMap.supports_storage() && !navigator.geolocation){
      var zipcode = localStorage.getItem("zipcode");
      if(zipcode){
        $(".zipcode").val(zipcode);
        $("header .search").click();
      }
    }

    /** 
    * Get the zipcode param if available
    */
    var $_GET = {};

    document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
        function decode(s) {
            return decodeURIComponent(s.split("+").join(" "));
        }

        $_GET[decode(arguments[1])] = decode(arguments[2]);
    });


    if (typeof($_GET['zipcode']) != undefined){ 
      $(".locator .zipcode").val($_GET['zipcode']);
      $(".search").click();
    }

    spheroMap.setupEvents();
    spheroMap.loadPoints();

  }
};  

$(spheroMap.init);