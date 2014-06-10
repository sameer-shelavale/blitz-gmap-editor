/*****************************************
 *
 * Function BlitzMap()
 * This function initializes the BlitzMap
 *
 *****************************************/
var BlitzMap = new function(){
    var mapObj, mapOptions,  drwManager, infWindow, currentMapIndex;
    var mapOverlays = new Array();
    var isEditable = false;
    var notifyErrors = true;
    var colorPicker;
    var mapContainerId, sideBar, mapDiv, mapStorageId;
    var routeUnit = "metric";
    var dirRenderer;
    var dirService;
    var dirTravelMode;
    var dirAvoidHighways = false;
    var dirAvoidTolls = false;
    var dirProvideRouteAlternatives = false;
    var dirRouteUnit;
    var dirOptimizeWaypoints = false;
    var geoXml = null;

    /*****************************************
     *
     * Function Init()
     * This function initializes the BlitzMap
     *
     *****************************************/
    this.init = function() {


        var mapOptions = {
            center: new google.maps.LatLng( 19.006295, 73.309021 ),
            zoom: 4,
            mapTypeId: google.maps.MapTypeId.HYBRID
        };

        //create a common infoWindow object
        infWindow = new google.maps.InfoWindow();

        if( isEditable ){
            //initialize a common Drawing Manager object
            //we will use only one Drawing Manager
            drwManager = new google.maps.drawing.DrawingManager({
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [
                        google.maps.drawing.OverlayType.MARKER,
                        google.maps.drawing.OverlayType.CIRCLE,
                        google.maps.drawing.OverlayType.RECTANGLE,
                        google.maps.drawing.OverlayType.POLYGON,
                        google.maps.drawing.OverlayType.POLYLINE
                    ]
                },
                markerOptions: { editable: true, draggable:true },              // markers created are editable by default
                circleOptions: { editable: true },              // circles created are editable by default
                rectangleOptions: { editable: true },   // rectangles created are editable by default
                polygonOptions: { editable: true },             // polygons created are editable by default
                polylineOptions: { editable: true }            // polylines created are editable by default
            });
        }


        if( mapDiv ){
            mapObj = new google.maps.Map( mapDiv, mapOptions );

            infWindow.setMap( mapObj );
            if( isEditable ){
                drwManager.setMap( mapObj );
                google.maps.event.addListener( infWindow, "domready", pickColor );
                google.maps.event.addListener( drwManager, "overlaycomplete", overlayDone );

            }

            if( mapStorageId ){
                //mapData is passed in a HTML input as JSON string
                //create overlays using that data
                setMapData( document.getElementById( mapStorageId ).value  );
            }

            //var ctaLayer = new google.maps.KmlLayer('http://possible.in/test3.kml');
            //ctaLayer.setMap(mapObj);
            dirRenderer = new google.maps.DirectionsRenderer();
            dirRenderer.setMap( mapObj );
            dirRenderer.setPanel( document.getElementById( mapContainerId + '_directions' ) );
            dirService = new google.maps.DirectionsService();
            dirTravelMode = google.maps.TravelMode.DRIVING;
            dirAvoidHighways = false;
            dirAvoidTolls = false;
            dirProvideRouteAlternatives = true;
            dirRouteUnit = google.maps.UnitSystem.METRIC;
            dirOptimizeWaypoints = true;
        }



    }



    /**************************************************
     * function setMap()
     * parameters:
     *              divId   : String, Id of HTML DIV element in which the gMap will be created
     *              edit    : Boolean(optional:default=false), tells you if the map objects can be edited or not
     *              inputId : String(optional), Id of HTML element which will be used to store/pass the serialized MAP data
     *
     **************************************************/
    this.setMap = function( divId, edit, inputId ){

        if( typeof divId == "string" ){
            if( document.getElementById( divId ) ){
                mapContainerId = divId;
                mapDiv = document.createElement('div');
                mapDiv.id = divId + "_map";
                setStyle( mapDiv, { height: "100%", width: "100%", position:"absolute", "zIndex":1000, left:"0" } );

                document.getElementById( mapContainerId ).appendChild( mapDiv );

                sideBar = document.createElement('div');
                sideBar.id = divId + "_sidebar";
                setStyle( sideBar, { height: "100%", width: "250px", display:"none", "backgroundColor":"#e6e6e6", "borderLeft":"5px solid #999", position:"absolute", "zIndex":"1", right:"0", fontFamily:"Arial", overflowY:'auto' } );

                document.getElementById( mapContainerId ).appendChild( sideBar );
                setStyle( document.getElementById( mapContainerId ), { position:"relative" } );
                sideBar.innerHTML =
                    '<div style="padding:10px 0 0 26px;">'
                        + '<style> div#'+ sideBar.id +' a.travelMode{ height:37px;width:32px;display:block;float:left;margin:0; background-position:bottom;background-repeat:no-repeat;outline:0;}'
                        + ' div#'+ sideBar.id +' a.travelMode:hover{ cursor:pointer; background-position:top;}'
                        + ' div#'+ sideBar.id +' span.route_row_menu{ font-size:12px;font-family:Arial; color:#ff0000; cursor:pointer; } '
                        + ' div#'+ mapContainerId + '_route div.route_row span{ width:20px;height:20px;display:inline-block; text-align:center; } '
                        + ' div#'+ mapContainerId + '_route_options{ font-size:12px; } '
                        + ' div#'+ mapContainerId + '_directions{ font-size:12px; }'
                        + '</style>'
                        + '<a id="'+ mapContainerId + '_mode_drive" href="javascript:void(0)" class="travelMode" style="background-image:url(images/car.png);background-position:top;" onclick="BlitzMap.setTravelMode( google.maps.TravelMode.DRIVING, this )" ></a>'
                        + '<a id="'+ mapContainerId + '_mode_walk" href="javascript:void(0)" class="travelMode" style="background-image:url(images/walk.png);" onclick="BlitzMap.setTravelMode( google.maps.TravelMode.WALKING, this)"></a>'
                        + '<a id="'+ mapContainerId + '_mode_bicycle" href="javascript:void(0)" class="travelMode" style="background-image:url(images/bicycle.png);" onclick="BlitzMap.setTravelMode( google.maps.TravelMode.BICYCLING, this )"></a>'
                        //+ '<a id="'+divId + '_mode_public" href="javascript:void(0)" class="travelMode" style="background-image:url(images/public.png);" onclick="BlitzMap.setTravelMode( google.maps.TravelMode.PUBLIC, this )"></a>'
                        + '<div style="clear:both;"></div>'
                        + '</div>'
                        + '<div id="'+ mapContainerId + '_route" style="margin:5px 5px 5px;">'
                        + '<div id="'+ mapContainerId + '_route_row_0" class="route_row"><span id="'+mapContainerId+'_route_row_0_title">A</span> <input  id="'+mapContainerId+'_route_row_0_dest" type="text" /><img id="'+mapContainerId+'_route_row_0_remove" alt="X" height="20" width="20" onclick="BlitzMap.removeDestination(this)" style="cursor:pointer;display:none;" /></div>'
                        + '<div id="'+ mapContainerId + '_route_row_1" class="route_row"><span id="'+mapContainerId+'_route_row_1_title">B</span> <input  id="'+mapContainerId+'_route_row_1_dest" type="text" /><img id="'+mapContainerId+'_route_row_1_remove" alt="X" height="20" width="20" onclick="BlitzMap.removeDestination(this)" style="cursor:pointer;display:none;" /></div>'
                        + '</div>'
                        + '<div id="'+ mapContainerId + '_route_menu" style="margin:5px 5px 5px 30px;">'
                        + '<span class="route_row_menu" onclick="BlitzMap.addDestination()">Add destination</span> - '
                        + '<span id="'+ mapContainerId + '_route_opt_btn" class="route_row_menu" onclick="BlitzMap.toggleRouteOptions()">Show Options</span>'
                        + '</div>'
                        + '<div id="'+ mapContainerId + '_route_options" style="margin:5px 5px;display:none;">'
                        + '<div style="float:right">'
                        + '<span id="'+ mapContainerId + '_route_unit_km" onclick="BlitzMap.setRouteUnit( google.maps.UnitSystem.METRIC )">Km</span> / '
                        + '<span id="'+ mapContainerId + '_route_unit_mi" class="route_row_menu"  onclick="BlitzMap.setRouteUnit( google.maps.UnitSystem.IMPERIAL )">Miles</span>'
                        + '</div>'
                        + '<div style="margin-left:20px">'
                        + '<input id="'+ mapContainerId + '_route_avoid_hw" type="checkbox" value="avoidHighways" onclick="BlitzMap.setAvoidHighways(this)" /><label for="'+ mapContainerId + '_route_avoid_hw">Avoid highways</label><br/>'
                        + '<input id="'+ mapContainerId + '_route_avoid_toll" type="checkbox" value="avoidTolls" onclick="BlitzMap.setAvoidTolls(this)" /><label for="'+ mapContainerId + '_route_avoid_toll">Avoid tolls</label> '
                        + '</div>'
                        + '</div>'
                        + '<div style="margin:0 0 10px 30px">'
                        + '<input type="button" onclick="BlitzMap.getRoute()" value="Get Directions">'
                        + '</div>'
                        + '<div style="clear:both;"></div>'
                        + '<div id="'+ mapContainerId + '_directions" style="">'
                        + '</div>';
            }else{
                notify( "BlitzMap Error: The DIV id you supplied for generating GMap is not present in the document." );
            }
        }else{
            notify( "BlitzMap Error: The DIV id you supplied for generating GMap is invalid. It should be a string representing the Id of Div element in which you want to create the map." )
        }

        if( edit == true ){
            isEditable = true;
        }

        if( typeof inputId == "string" ){

            if( document.getElementById( inputId ) ){
                mapStorageId = inputId;

            }else{
                notify( "BlitzMap Error: The INPUT id you supplied for storing the JSON string is not present in the document." );
            }
        }
    }

    this.setAvoidHighways = function( obj ){
        dirAvoidHighways = obj.checked;
    }

    this.setAvoidTolls = function( obj ){
        dirAvoidTolls = obj.checked;
    }

    this.setTravelMode = function( mode, menuObj ){
        dirTravelMode = mode;
        setStyle( document.getElementById( mapContainerId + '_mode_drive' ), { backgroundPosition: "bottom" } );
        setStyle( document.getElementById( mapContainerId + '_mode_walk' ), { backgroundPosition: "bottom" } );
        setStyle( document.getElementById( mapContainerId + '_mode_bicycle' ), { backgroundPosition: "bottom" } );
        setStyle( menuObj, { backgroundPosition: "top" } );
    }

    this.getRoute = function(){
        var start, end;
        var waypts = [];
        var routeDiv = document.getElementById( mapContainerId + '_route' );

        for( var i=0; i < routeDiv.children.length; i++ ){
            if( i== 0 ){
                start = routeDiv.children[i].children[1].value;
            }else if( i== routeDiv.children.length-1 ){
                end = routeDiv.children[i].children[1].value;
            }else{
                waypts.push({
                    location:routeDiv.children[i].children[1].value,
                    stopover:true
                });
            }
        }

        var request = {
            origin: start,
            destination: end,
            waypoints: waypts,
            optimizeWaypoints: false,
            travelMode: dirTravelMode,
            avoidHighways: dirAvoidHighways,
            avoidTolls: dirAvoidTolls,
            provideRouteAlternatives: dirProvideRouteAlternatives,
            unitSystem: dirRouteUnit,
            optimizeWaypoints: dirOptimizeWaypoints
        };

        dirService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                dirRenderer.setDirections(response);
                /*var summaryPanel = document.getElementById( mapContainerId + '_directions' );
                 summaryPanel.innerHTML = "";
                 for( var j=0; j < response.routes.length; j++ ) {
                 var route = response.routes[j];

                 // For each route, display summary information.
                 for (var i = 0; i < route.legs.length; i++) {
                 var routeSegment = i+1;
                 summaryPanel.innerHTML += "<b>Route Segment: " + routeSegment + "</b><br />";
                 summaryPanel.innerHTML += route.legs[i].start_address + " to ";
                 summaryPanel.innerHTML += route.legs[i].end_address + "<br />";
                 summaryPanel.innerHTML += route.legs[i].distance.text + "<br /><br />";
                 }
                 }*/
            }
        });

    }



    this.addDestination = function(){
        var routeDiv = document.getElementById( mapContainerId + '_route' );
        var routeNum = routeDiv.children.length;
        if( routeNum == 8 ){
            alert( "You have reached maximum number of destinations that can be searched with Google Directions API." )
            return;
        }
        var newDest = document.createElement('div');
        newDest.id = mapContainerId +'_route_row_'+ routeNum.toString();
        newDest.className = 'route_row';

        newDest.innerHTML = '<span id="'+mapContainerId+'_route_row_'+routeNum+'_title">'+String.fromCharCode(65+routeNum)+'</span> '
            + '<input id="'+mapContainerId+'_route_row_'+routeNum+'_dest" type="text" />'
            + '<img id="'+mapContainerId+'_route_row_'+routeNum+'_remove" alt="X" height="20" width="20" onclick="BlitzMap.removeDestination(this)" style="cursor:pointer" />';
        routeDiv.appendChild( newDest );
        for( var i=0; i < routeDiv.children.length; i++ ){
            if( i<2 && routeDiv.children.length <= 2 ){
                routeDiv.children[i].children[2].style.display = "none";
            }else{
                routeDiv.children[i].children[2].style.display = "inline";
            }
        }
    }

    this.removeDestination = function( obj ){
        var rowDiv = obj.parentNode;
        var routeDiv = rowDiv.parentNode;
        routeDiv.removeChild( rowDiv );

        for( var i=0; i < routeDiv.children.length; i++ ){
            routeDiv.children[i].id = mapContainerId+'_route_row_'+i;
            routeDiv.children[i].children[0].id = mapContainerId+'_route_row_'+i+'_title';
            routeDiv.children[i].children[0].innerHTML = String.fromCharCode(65+i)
            routeDiv.children[i].children[1].id = mapContainerId+'_route_row_'+i+'_dest';

            routeDiv.children[i].children[2].id = mapContainerId+'_route_row_'+i+'_remove'
            if( i<2 && routeDiv.children.length <= 2 ){
                routeDiv.children[i].children[2].style.display = "none";
            }else{
                routeDiv.children[i].children[2].style.display = "inline";
            }
        }
    }

    this.setRouteUnit = function( unt ){
        dirRouteUnit = unt;
        if( dirRouteUnit == google.maps.UnitSystem.IMPERIAL ){
            document.getElementById( mapContainerId + '_route_unit_mi' ).className = "";
            document.getElementById( mapContainerId + '_route_unit_km' ).className = "route_row_menu";
        }else{
            document.getElementById( mapContainerId + '_route_unit_mi' ).className = "route_row_menu";
            document.getElementById( mapContainerId + '_route_unit_km' ).className = "";
        }
    }

    this.toggleRouteOptions = function(){
        if( getStyle( document.getElementById( mapContainerId + "_route_options" ), "display" ) == "block" ){
            setStyle( document.getElementById( mapContainerId + "_route_options" ), { display:"none" } );
            document.getElementById( mapContainerId + "_route_opt_btn" ).innerHTML = "Show Options";

        }else{
            setStyle( document.getElementById( mapContainerId + "_route_options" ), { display:"block" } );
            document.getElementById( mapContainerId + "_route_opt_btn" ).innerHTML = "Hide Options";
        }

    }


    function overlayDone( event ) {
        var uniqueid =  uniqid();
        event.overlay.uniqueid =  uniqueid;
        event.overlay.title = "";
        event.overlay.content = "";
        event.overlay.type = event.type;
        mapOverlays.push( event.overlay );
        AttachClickListener( event.overlay );
        openInfowindow( event.overlay, getShapeCenter( event.overlay ), getEditorContent( event.overlay ) );
    }


    function getShapeCenter( shape ){
        if( shape.type == "marker" ){
            return shape.position;
        }else if( shape.type == "circle" ){
            return shape.getCenter();
        }else if( shape.type == "rectangle" ){
            return new google.maps.LatLng( (shape.getBounds().getSouthWest().lat() + shape.getBounds().getNorthEast().lat() )/2, (shape.getBounds().getSouthWest().lng() + shape.getBounds().getNorthEast().lng() )/2 )
        }else if( shape.type == "polygon" ){
            return shape.getPaths().getAt(0).getAt(0);
        }else if( shape.type == "polyline" ){
            return shape.getPath().getAt( Math.round( shape.getPath().getLength()/3 ) );
        }
    }

    function AttachClickListener( overlay ){
        google.maps.event.addListener( overlay, "click", function(clkEvent){

            if( isEditable ){
                var infContent =      getEditorContent( overlay );

            }else{
                var infContent = GetContent( overlay );
            }

            openInfowindow( overlay, clkEvent.latLng, infContent );

        } ) ;

    }

    function GetContent( overlay ){
        var content =
            '<div><h3>'+overlay.title+'</h3>'+overlay.content+'<br></div>'
                + GetInfoWindowFooter( overlay );
        return content;
    }

    function GetInfoWindowFooter( overlay ){
        var content =
            '<div id="'+mapContainerId+'_dirContainer" style="bottom:0;padding-top:3px; font-size:13px;font-family:arial">'
                + '<div  style="border-top:1px dotted #999;">'
                + '<style>.BlitzMap_Menu:hover{text-decoration:underline; }</style>'
                + '<span class="BlitzMap_Menu" style="color:#ff0000; cursor:pointer;padding:0 5px;" onclick="BlitzMap.getDirections()">Directions</span>'
                + '<span class="BlitzMap_Menu" style="color:#ff0000; cursor:pointer;padding:0 5px;">Search nearby</span>'
                + '<span class="BlitzMap_Menu" style="color:#ff0000; cursor:pointer;padding:0 5px;">Save to map</span>'
                + '</div></div>';
        return content;
    }



    this.getDirections = function(){
        setStyle( sideBar, { display: "block" } );
        setStyle( mapDiv, { width: "70%"} );
        google.maps.event.trigger(mapObj, 'resize');
        //mapObj.panTo( mapObj.getBounds() );

    }



    function openInfowindow( overlay, latLng, content ){
        var div = document.createElement('div');
        div.innerHTML = content;
        setStyle( div, {height: "100%"} );
        infWindow.setContent( div );
        infWindow.setPosition( latLng );
        infWindow.relatedOverlay = overlay;
        var t = overlay.get( 'fillColor' );
        infWindow.open( mapObj );
    }

    function getEditorContent( overlay ){

        var content = '<style>'
            + '#BlitzMapInfoWindow_container input:focus, #BlitzMapInfoWindow_container textarea:focus{border:2px solid #7DB1FF;} '
            + '#BlitzMapInfoWindow_container .BlitzMapInfoWindow_button{background-color:#2883CE;color:#ffffff;padding:3px 10px;border:2px double #cccccc;cursor:pointer;} '
            + '.BlitzMapInfoWindow_button:hover{background-color:#2883CE;border-color:#05439F;} '
            + '</style>'

            + '<form style="height:100%"><div id="BlitzMapInfoWindow_container" style="height:100%">'
            + '<div id="BlitzMapInfoWindow_details">'
            + '<div style="padding-bottom:3px;">Title:&nbsp;&nbsp;<input type="text" id="BlitzMapInfoWindow_title" value="'+overlay.title+'" style="border:2px solid #dddddd;width:150px;padding:3px;" ></div>'
            + '<div style="padding-bottom:3px;">Description:<br><textarea id="BlitzMapInfoWindow_content" style="border:2px solid #dddddd;width:250px;height:115px;">'+overlay.content+'</textarea></div>'
            + '</div>'
            + '<div id="BlitzMapInfoWindow_styles" style="display:none;width:100%;">'
            + '<div style="height:25px;padding-bottom:2px;font-weight:bold;">Styles &amp; Colors</div>';

        if( overlay.type == 'polygon' || overlay.type == 'circle' || overlay.type == 'rectangle' ){

            var fillColor = ( overlay.fillColor == undefined )? "#000000":overlay.fillColor;
            content += '<div style="height:25px;padding-bottom:3px;">Fill Color: <input type="text" id="BlitzMapInfoWindow_fillcolor" value="'+ fillColor +'" style="border:2px solid #dddddd;width:30px;height:20px;font-size:0;float:right" ></div>';

            var fillOpacity = ( overlay.fillOpacity == undefined )? 0.3:overlay.fillOpacity;
            content += '<div style="height:25px;padding-bottom:3px;">Fill Opacity(percent): <input type="text" id="BlitzMapInfoWindow_fillopacity" value="'+ fillOpacity.toString() +'"  style="border:2px solid #dddddd;width:30px;float:right" onkeyup="BlitzMap.updateOverlay()" ></div>';

        }
        if( overlay.type != 'marker' ){

            var strokeColor = ( overlay.strokeColor == undefined )? "#000000":overlay.strokeColor;
            content += '<div style="height:25px;padding-bottom:3px;">Line Color: <input type="text" id="BlitzMapInfoWindow_strokecolor" value="'+ strokeColor +'" style="border:2px solid #dddddd;width:30px;height:20px;font-size:0;float:right" ></div>';

            var strokeOpacity = ( overlay.strokeOpacity == undefined )? 0.9:overlay.strokeOpacity;
            content += '<div style="height:25px;padding-bottom:3px;">Line Opacity(percent): <input type="text" id="BlitzMapInfoWindow_strokeopacity" value="'+ strokeOpacity.toString() +'" style="border:2px solid #dddddd;width:30px;float:right" onkeyup="BlitzMap.updateOverlay()" ></div>';

            var strokeWeight = ( overlay.strokeWeight == undefined )? 3:overlay.strokeWeight;
            content += '<div style="height:25px;padding-bottom:3px;">Line Thickness(pixels): <input type="text" id="BlitzMapInfoWindow_strokeweight" value="'+ strokeWeight.toString() +'" style="border:2px solid #dddddd;width:30px;float:right" onkeyup="BlitzMap.updateOverlay()" ></div>';

        }else{

            //var strokeColor = ( overlay.strokeColor == undefined )? "#000000":overlay.strokeColor;
            //content += '<div style="height:25px;padding-bottom:3px;">Line Color: <input type="text" id="BlitzMapInfoWindow_strokecolor" value="'+ strokeColor +'" style="border:2px solid #dddddd;width:30px;height:20px;font-size:0;float:right" ></div>';

            //var animation = overlay.getAnimation();
            //content += '<div style="height:25px;padding-bottom:3px;">Line Opacity(percent): <select id="BlitzMapInfoWindow_animation" style="border:2px solid #dddddd;width:30px;float:right" ><option value="none">None</option><option value="bounce">Bounce</option><option value="drop">Drop</option></div>';

            var icon = ( overlay.icon == undefined )? "":overlay.icon;
            content += '<div style="height:25px;padding-bottom:3px;">Icon(): <input type="text" id="BlitzMapInfoWindow_icon" value="'+ icon.toString() +'" style="border:2px solid #dddddd;width:100px;float:right" ></div>';

        }
        content += '</div><div style="position:relative; bottom:0px;"><input type="button" value="Delete" class="BlitzMapInfoWindow_button" onclick="BlitzMap.deleteOverlay()" style="background-color:#2883CE;color:#ffffff;padding:3px 10px;border:2px double #cccccc;cursor:pointer;" title"Delete selected shape">&nbsp;&nbsp;'
            +  '<input type="button" value="OK" class="BlitzMapInfoWindow_button" onclick="BlitzMap.closeInfoWindow()" style="background-color:#2883CE;color:#ffffff;padding:3px 10px;border:2px double #cccccc;cursor:pointer;float:right;" title="Apply changes to the overlay">'
            +  '<input type="button" value="Cancel" class="BlitzMapInfoWindow_button" onclick="this.form.reset();BlitzMap.closeInfoWindow()" style="background-color:#2883CE;color:#ffffff;padding:3px 10px;border:2px double #cccccc;cursor:pointer;float:right;">'
            + '<div style="clear:both;"></div>'
            + '<input type="button" id="BlitzMapInfoWindow_toggle" title="Manage Colors and Styles" onclick="BlitzMap.toggleStyleEditor();return false;" style="border:0;float:right;margin-top:5px;cursor:pointer;background-color:#fff;color:#2883CE;font-family:Arial;font-size:12px;text-align:right;" value="Customize Colors&gt;&gt;" />';
        + '<div style="clear:both;"></div>';
        + '</div>';
        + '</div></form>'


        return content;
    }


    function pickColor(){
        if( document.getElementById('BlitzMapInfoWindow_fillcolor') ){
            var bgcolor = new jscolor.color(document.getElementById('BlitzMapInfoWindow_fillcolor'), {})
        }
        if( document.getElementById('BlitzMapInfoWindow_strokecolor') ){
            var bdColor = new jscolor.color(document.getElementById('BlitzMapInfoWindow_strokecolor'), {})
        }


    }

    this.deleteOverlay = function(){
        infWindow.relatedOverlay.setMap( null );
        infWindow.close();
    }

    this.closeInfoWindow = function(){
        this.updateOverlay();
        infWindow.close();
    }

    this.updateOverlay = function(){
        infWindow.relatedOverlay.title = document.getElementById( 'BlitzMapInfoWindow_title' ).value;
        infWindow.relatedOverlay.content = document.getElementById( 'BlitzMapInfoWindow_content' ).value;

        if( infWindow.relatedOverlay.type == 'polygon' || infWindow.relatedOverlay.type == 'circle' || infWindow.relatedOverlay.type == 'rectangle' ){

            infWindow.relatedOverlay.setOptions( {fillColor: '#'+document.getElementById( 'BlitzMapInfoWindow_fillcolor' ).value.replace('#','') } );
            setStyle( document.getElementById( 'BlitzMapInfoWindow_fillcolor' ), { 'background-color': '#'+document.getElementById( 'BlitzMapInfoWindow_fillcolor' ).value.replace('#','') } );

            infWindow.relatedOverlay.setOptions( {fillOpacity: Number( document.getElementById( 'BlitzMapInfoWindow_fillopacity' ).value ) } );
        }

        if( infWindow.relatedOverlay.type != 'marker' ){
            infWindow.relatedOverlay.setOptions( {strokeColor: '#'+document.getElementById( 'BlitzMapInfoWindow_strokecolor' ).value.replace('#','') } );

            infWindow.relatedOverlay.setOptions( {strokeOpacity: Number( document.getElementById( 'BlitzMapInfoWindow_strokeopacity' ).value ) } );

            infWindow.relatedOverlay.setOptions( {strokeWeight: Number( document.getElementById( 'BlitzMapInfoWindow_strokeweight' ).value ) } );
        }else{
            infWindow.relatedOverlay.setOptions( {icon: document.getElementById( 'BlitzMapInfoWindow_icon' ).value } );
        }
    }


    this.toggleStyleEditor = function(){
        var tmp = document.getElementById( 'BlitzMapInfoWindow_details' );
        var tmp1 = document.getElementById( 'BlitzMapInfoWindow_styles' );
        if( tmp ){
            if( getStyle( tmp, "display" ) == 'none' ){
                setStyle( tmp1, { display: "none" } );
                document.getElementById( 'BlitzMapInfoWindow_toggle' ).value = "Customize Colors>>"
                setStyle( tmp, { display: "block" } );

            }else{
                setStyle( tmp, { display: "none" } );
                document.getElementById( 'BlitzMapInfoWindow_toggle' ).value = "Back>>"
                setStyle( tmp1, { display: "block" } );
            }

        }
    }


    function notify ( msg ){
        if( notifyErrors ){
            alert( msg );
        }
    }

    function uniqid(){
        var newDate = new Date;
        return newDate.getTime();
    }

    function setMapData( jsonString ){
        if( typeof jsonString == 'undefined' || jsonString.length == 0 ){
            return false;
        }
        var inputData = JSON.parse( jsonString );
        if( inputData.zoom ){
            mapObj.setZoom( inputData.zoom );
        }else{
            mapObj.setZoom( 10 );
        }

        if( inputData.tilt ){
            mapObj.setTilt( inputData.tilt );
        }else{
            mapObj.setTilt( 0 );
        }

        if( inputData.mapTypeId ){
            mapObj.setMapTypeId( inputData.mapTypeId );
        }else{
            mapObj.setMapTypeId( "hybrid" );
        }

        if( inputData.center ){
            mapObj.setCenter( new google.maps.LatLng( inputData.center.lat, inputData.center.lng ) );
        }else{
            mapObj.setCenter( new google.maps.LatLng( 19.006295, 73.309021 ) );
        }



        var tmpOverlay, ovrOptions;
        var properties = new Array( 'fillColor', 'fillOpacity', 'strokeColor', 'strokeOpacity','strokeWeight', 'icon');
        for( var m = inputData.overlays.length-1; m >= 0; m-- ){
            ovrOptions = new Object();

            for( var x=properties.length; x>=0; x-- ){
                if( inputData.overlays[m][ properties[x] ] ){
                    ovrOptions[ properties[x] ] = inputData.overlays[m][ properties[x] ];
                }
            }


            if( inputData.overlays[m].type == "polygon" ){

                var tmpPaths = new Array();
                for( var n=0; n < inputData.overlays[m].paths.length; n++ ){

                    var tmpPath = new Array();
                    for( var p=0; p < inputData.overlays[m].paths[n].length; p++ ){
                        tmpPath.push(  new google.maps.LatLng( inputData.overlays[m].paths[n][p].lat, inputData.overlays[m].paths[n][p].lng ) );
                    }
                    tmpPaths.push( tmpPath );
                }
                ovrOptions.paths = tmpPaths;
                tmpOverlay = new google.maps.Polygon( ovrOptions );

            }else if( inputData.overlays[m].type == "polyline" ){

                var tmpPath = new Array();
                for( var p=0; p < inputData.overlays[m].path.length; p++ ){
                    tmpPath.push(  new google.maps.LatLng( inputData.overlays[m].path[p].lat, inputData.overlays[m].path[p].lng ) );
                }
                ovrOptions.path = tmpPath;
                tmpOverlay = new google.maps.Polyline( ovrOptions );

            }else if( inputData.overlays[m].type == "rectangle" ){
                var tmpBounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng( inputData.overlays[m].bounds.sw.lat, inputData.overlays[m].bounds.sw.lng ),
                    new google.maps.LatLng( inputData.overlays[m].bounds.ne.lat, inputData.overlays[m].bounds.ne.lng ) );
                ovrOptions.bounds = tmpBounds;
                tmpOverlay = new google.maps.Rectangle( ovrOptions );

            }else if( inputData.overlays[m].type == "circle" ){
                var cntr = new google.maps.LatLng( inputData.overlays[m].center.lat, inputData.overlays[m].center.lng );
                ovrOptions.center = cntr;
                ovrOptions.radius = inputData.overlays[m].radius;
                tmpOverlay = new google.maps.Circle( ovrOptions );

            }else if( inputData.overlays[m].type == "marker" ){
                var pos = new google.maps.LatLng( inputData.overlays[m].position.lat, inputData.overlays[m].position.lng );
                ovrOptions.position = pos;
                if( inputData.overlays[m].icon ){
                    ovrOptions.icon = inputData.overlays[m].icon ;
                }
                if( isEditable ){
                    ovrOptions.draggable =true;
                }
                tmpOverlay = new google.maps.Marker( ovrOptions );

            }
            tmpOverlay.type = inputData.overlays[m].type;
            tmpOverlay.setMap( mapObj );
            if( isEditable && inputData.overlays[m].type != "marker"){
                tmpOverlay.setEditable( true );

            }

            var uniqueid =  uniqid();
            tmpOverlay.uniqueid =  uniqueid;
            if( inputData.overlays[m].title ){
                tmpOverlay.title = inputData.overlays[m].title;
            }else{
                tmpOverlay.title = "";
            }

            if( inputData.overlays[m].content ){
                tmpOverlay.content = inputData.overlays[m].content;
            }else{
                tmpOverlay.content = "";
            }

            //attach the click listener to the overlay
            AttachClickListener( tmpOverlay );

            //save the overlay in the array
            mapOverlays.push( tmpOverlay );

        }

    }

    this.setEditable = function(editable){
        isEditable = editable;
        for( var i=0; i < mapOverlays.length; i++ ){
            if( mapOverlays[i].getMap() != null ){
                mapOverlays[i].setOptions({editable:isEditable});
            }
        }
    }

    this.toggleEditable = function(){
        isEditable = !isEditable;
        for( var i=0; i < mapOverlays.length; i++ ){
            if( mapOverlays[i].getMap() != null ){
                if (mapOverlays[i].setEditable) mapOverlays[i].setEditable(isEditable);;
            }
        }
    }

    this.setMapFromEncoded = function ( encodedString ){
        if( encodedString.length == 0 ){
            return false;
        }
        var pointsArray = google.maps.geometry.encoding.decodePath( encodedString );
        var tmpBounds = new google.maps.LatLngBounds();
        for (var i = 0; i < pointsArray.length; i++)
        {
            tmpBounds.extend(pointsArray[i]);
        }
        var tmpOverlay;
        var ovrOptions = new Object();
        var properties = new Array( 'fillColor', 'fillOpacity', 'strokeColor', 'strokeOpacity','strokeWeight', 'icon');
        ovrOptions.strokeWidth = 2;
        ovrOptions.strokeColor = "#0000FF";
        ovrOptions.strokeOpacity = 0.8;
        ovrOptions.fillColor =  "#0000FF";
        ovrOptions.fillOpacity = 0.2;
        ovrOptions.paths = [pointsArray];
        tmpOverlay = new google.maps.Polygon( ovrOptions );

        tmpOverlay.type = "polygon";
        tmpOverlay.setMap( mapObj );
        mapObj.fitBounds(tmpBounds);
        tmpOverlay.setEditable( true );

        var uniqueid =  uniqid();
        tmpOverlay.uniqueid =  uniqueid;
        tmpOverlay.title = "";
        tmpOverlay.content = "";

        //attach the click listener to the overlay
        AttachClickListener( tmpOverlay );

        //save the overlay in the array
        mapOverlays.push( tmpOverlay );

    }

    this.setMapFromKML = function ( kmlString ){
        if( kmlString.length == 0 ){
            return false;
        }
        if (typeof geoXML3 == "undefined") { // check for include of geoxml3 parser
            // http://code.google.com/p/geoxml3/
            alert("geoxml3.js not included");
            return;
        }
        if (!geoXml)
            geoXml = new geoXML3.parser({
                map: mapObj,
                zoom: false,
                suppressInfoWindows: true
            });

        geoXml.parseKmlString( kmlString );

        var tmpOverlay, ovrOptions;
        for (var m=0; m < geoXml.docs[0].placemarks.length; m++) {
            if( geoXml.docs[0].placemarks[m].Polygon){

                tmpOverlay = geoXml.docs[0].placemarks[m].polygon;
                if( isEditable ){
                    tmpOverlay.setEditable( true );
                }
                tmpOverlay.type = "polygon";
            }else if( geoXml.docs[0].placemarks[m].LineString){

                tmpOverlay = geoXml.docs[0].placemarks[m].polyline;
                if( isEditable ){
                    tmpOverlay.setEditable( true );
                }
                tmpOverlay.type = "polyline";
            }else if( geoXml.docs[0].placemarks[m].Point){

                tmpOverlay = geoXml.docs[0].placemarks[m].marker;
                tmpOverlay.type = "marker";         }


            var uniqueid =  uniqid();
            tmpOverlay.uniqueid =  uniqueid;
            if( geoXml.docs[0].placemarks[m].name ){
                tmpOverlay.title = geoXml.docs[0].placemarks[m].name;
            }else{
                tmpOverlay.title = "";
            }

            if(  geoXml.docs[0].placemarks[m].description ){
                tmpOverlay.content =  geoXml.docs[0].placemarks[m].description;
            }else{
                tmpOverlay.content = "";
            }

            //attach the click listener to the overlay
            AttachClickListener( tmpOverlay );

            //save the overlay in the array
            mapOverlays.push( tmpOverlay );
        }
        mapObj.fitBounds(geoXml.docs[0].bounds);
    }

    this.deleteAll = function() {
        for( var i=0; i < mapOverlays.length; i++ ){
            mapOverlays[i].setMap(null)
        }
        mapOverlays = [];
    }

    function mapToObject(){
        var tmpMap = new Object;
        var tmpOverlay, paths;
        tmpMap.zoom = mapObj.getZoom();
        tmpMap.tilt = mapObj.getTilt();
        tmpMap.mapTypeId = mapObj.getMapTypeId();
        tmpMap.center = { lat: mapObj.getCenter().lat(), lng: mapObj.getCenter().lng() };
        tmpMap.overlays = new Array();

        for( var i=0; i < mapOverlays.length; i++ ){
            if( mapOverlays[i].getMap() == null ){
                continue;
            }
            tmpOverlay = new Object;
            tmpOverlay.type = mapOverlays[i].type;
            tmpOverlay.title = mapOverlays[i].title;
            tmpOverlay.content = mapOverlays[i].content;

            if( mapOverlays[i].fillColor ){
                tmpOverlay.fillColor = mapOverlays[i].fillColor;
            }

            if( mapOverlays[i].fillOpacity ){
                tmpOverlay.fillOpacity = mapOverlays[i].fillOpacity;
            }

            if( mapOverlays[i].strokeColor ){
                tmpOverlay.strokeColor = mapOverlays[i].strokeColor;
            }

            if( mapOverlays[i].strokeOpacity ){
                tmpOverlay.strokeOpacity = mapOverlays[i].strokeOpacity;
            }

            if( mapOverlays[i].strokeWeight ){
                tmpOverlay.strokeWeight = mapOverlays[i].strokeWeight;
            }

            if( mapOverlays[i].icon ){
                tmpOverlay.icon = mapOverlays[i].icon;
            }

            if( mapOverlays[i].flat ){
                tmpOverlay.flat = mapOverlays[i].flat;
            }

            if( mapOverlays[i].type == "polygon" ){
                tmpOverlay.paths = new Array();
                paths = mapOverlays[i].getPaths();
                for( var j=0; j < paths.length; j++ ){
                    tmpOverlay.paths[j] = new Array();
                    for( var k=0; k < paths.getAt(j).length; k++ ){
                        tmpOverlay.paths[j][k] = { lat: paths.getAt(j).getAt(k).lat().toString() , lng: paths.getAt(j).getAt(k).lng().toString() };
                    }
                }

            }else if( mapOverlays[i].type == "polyline" ){
                tmpOverlay.path = new Array();
                path = mapOverlays[i].getPath();
                for( var j=0; j < path.length; j++ ){
                    tmpOverlay.path[j] = { lat: path.getAt(j).lat().toString() , lng: path.getAt(j).lng().toString() };
                }

            }else if( mapOverlays[i].type == "circle" ){
                tmpOverlay.center = { lat: mapOverlays[i].getCenter().lat(), lng: mapOverlays[i].getCenter().lng() };
                tmpOverlay.radius = mapOverlays[i].radius;
            }else if( mapOverlays[i].type == "rectangle" ){
                tmpOverlay.bounds = {  sw: {lat: mapOverlays[i].getBounds().getSouthWest().lat(), lng: mapOverlays[i].getBounds().getSouthWest().lng()},
                    ne:     {lat: mapOverlays[i].getBounds().getNorthEast().lat(), lng: mapOverlays[i].getBounds().getNorthEast().lng()}
                };
            }else if( mapOverlays[i].type == "marker" ){
                tmpOverlay.position = { lat: mapOverlays[i].getPosition().lat(), lng: mapOverlays[i].getPosition().lng() };
            }
            tmpMap.overlays.push( tmpOverlay );
        }

        return tmpMap;

    }

    /*****************************************
     *
     * Function replaceOverlays()
     * This function replaces existing overlays if there's many map instances
     * parameters:
     *              divId   : String, Id of HTML DIV element in which the gMap will be created
     *
     *****************************************/
    this.replaceOverlays = function(divId) {
		divId = divId + "_map"; // override from setMap() - mapDiv.id = divId + "_map";
		
		var tmpOverlays = new Array();
		
		for( var i=0; i < mapOverlays.length; i++ ) {
		
			var m = mapOverlays[i].getMap();
			var d = m.getDiv();
			
			if( divId == d.id ) {
				tmpOverlays.push( mapOverlays[i] );
			}
			
		}

		mapOverlays = tmpOverlays;
	}

    this.toJSONString = function(){
        var result = JSON.stringify( mapToObject() );

        if( mapStorageId ){
            document.getElementById( mapStorageId ).value =  result;
        }

        return result;
    }

    this.toKML = function(){
        var result = mapToObject();
        var xw = new XMLWriter('UTF-8');
        xw.formatting = 'indented';//add indentation and newlines
        xw.indentChar = ' ';//indent with spaces
        xw.indentation = 2;//add 2 spaces per level

        xw.writeStartDocument( );
        xw.writeStartElement( 'kml' );
        xw.writeAttributeString( "xmlns", "http://www.opengis.net/kml/2.2" );
        xw.writeStartElement('Document');

        for( var i = 0; i < result.overlays.length; i++ ){
            xw.writeStartElement('Placemark');
            xw.writeStartElement('name');
            xw.writeCDATA( result.overlays[i].title );
            xw.writeEndElement();
            xw.writeStartElement('description');
            xw.writeCDATA( result.overlays[i].content );
            xw.writeEndElement();
            if( result.overlays[i].type == "marker" ){

                xw.writeStartElement('Point');
                xw.writeElementString('extrude', '1');
                xw.writeElementString('altitudeMode', 'relativeToGround');
                xw.writeElementString('coordinates', result.overlays[i].position.lng.toString()+","+result.overlays[i].position.lat.toString()+",0");
                xw.writeEndElement();

            }else if( result.overlays[i].type == "polygon" || result.overlays[i].type == "rectangle" || result.overlays[i].type == "circle" ){
                xw.writeStartElement('Polygon');
                xw.writeElementString('extrude', '1');
                xw.writeElementString('altitudeMode', 'relativeToGround');

                if( result.overlays[i].type == "rectangle" ){
                    //its a polygon
                    xw.writeStartElement('outerBoundaryIs');
                    xw.writeStartElement('LinearRing');
                    xw.writeStartElement( "coordinates" );
                    xw.writeString( result.overlays[i].bounds.sw.lng + "," + result.overlays[i].bounds.sw.lat + ",0" );
                    xw.writeString( result.overlays[i].bounds.ne.lng + "," + result.overlays[i].bounds.sw.lat + ",0" );
                    xw.writeString( result.overlays[i].bounds.ne.lng + "," + result.overlays[i].bounds.ne.lat + ",0" );
                    xw.writeString( result.overlays[i].bounds.sw.lng + "," + result.overlays[i].bounds.ne.lat + ",0" );
                    xw.writeEndElement();
                    xw.writeEndElement();
                    xw.writeEndElement();
                }else if (result.overlays[i].type == "circle"){
                    //its a polygon, approximate a circle by a circular 64 sided polygon.
                    xw.writeStartElement('outerBoundaryIs');
                    xw.writeStartElement('LinearRing');
                    xw.writeStartElement( "coordinates" );
                    var d2r = Math.PI / 180;   // degrees to radians
                    var r2d = 180 / Math.PI;   // radians to degrees
                    var earthsradius = 6378137; // 6378137 is the radius of the earth in meters
                    var dir = 1; // clockwise

                    var points = 64;

                    // find the raidus in lat/lon
                    var rlat = (result.overlays[i].radius / earthsradius) * r2d;
                    var rlng = rlat / Math.cos(result.overlays[i].center.lat * d2r);

                    var extp = new Array();
                    if (dir==1)     {var start=0;var end=points+1} // one extra here makes sure we connect the line
                    else            {var start=points+1;var end=0}
                    for (var j=start; (dir==1 ? j < end : j > end); j=j+dir){
                        var theta = Math.PI * (j / (points/2));
                        ey = result.overlays[i].center.lng + (rlng * Math.cos(theta)); // center a + radius x * cos(theta)
                        ex = result.overlays[i].center.lat + (rlat * Math.sin(theta)); // center b + radius y * sin(theta)
                        xw.writeString( ey + "," + ex + ",0" );
                    }
                    xw.writeEndElement();
                    xw.writeEndElement();
                    xw.writeEndElement();
                }else{
                    for( var j=0; j < result.overlays[i].paths.length; j++ ){
                        if( j==0 ){
                            xw.writeStartElement('outerBoundaryIs');
                        }else{
                            xw.writeStartElement('innerBoundaryIs');
                        }
                        xw.writeStartElement('LinearRing');
                        xw.writeStartElement( "coordinates" );
                        for( var k=0; k < result.overlays[i].paths[j].length; k++ ){
                            xw.writeString( result.overlays[i].paths[j][k].lng + "," + result.overlays[i].paths[j][k].lat + ",0" );
                        }
                        xw.writeEndElement();
                        xw.writeEndElement();
                        xw.writeEndElement();
                    }
                }
                xw.writeEndElement();

            }else if( result.overlays[i].type == "polyline" ){
                xw.writeStartElement('LineString');
                xw.writeElementString('extrude', '1');
                xw.writeElementString('altitudeMode', 'relativeToGround');
                xw.writeStartElement( "coordinates" );
                for( var j=0; j < result.overlays[i].path.length; j++ ){
                    xw.writeString( result.overlays[i].path[j].lng + "," + result.overlays[i].path[j].lat + ",0" );
                }
                xw.writeEndElement();
                xw.writeEndElement();

            }

            xw.writeEndElement(); // END PlaceMarker
        }

        xw.writeEndElement();
        xw.writeEndElement();
        xw.writeEndDocument();

        var xml = xw.flush(); //generate the xml string
        xw.close();//clean the writer
        xw = undefined;//don't let visitors use it, it's closed
        //set the xml
        document.getElementById('kmlString').value = xml;
    }

    function getStyle( elem, prop ){

        if( document.defaultView && document.defaultView.getComputedStyle ){
            return document.defaultView.getComputedStyle(elem, null).getPropertyValue(prop);
        }else if( elem.currentStyle ){
            var ar = prop.match(/\w[^-]*/g);
            var s = ar[0];
            for(var i = 1; i < ar.length; ++i){
                s += ar[i].replace(/\w/, ar[i].charAt(0).toUpperCase());
            }
            return elem.currentStyle[s];
        }else{
            return 0;
        }
    }

    function setStyle( domElem, styleObj ){

        if( typeof styleObj == "object" ){
            for( var prop in styleObj ){
                domElem.style[ prop ] = styleObj[ prop ];
            }
        }
    }
}

google.maps.event.addDomListener(window, "load", BlitzMap.init);
