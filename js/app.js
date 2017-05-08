// Set global map variable
var map;

// Error mesage if google maps does not loading
function mapError() {
    alert("Something went wrong. Google Maps API could not be loaded. " +
        "Please try reloading the page.");
}

var model = {
    currentLocation: ko.observable(null),
    data: locations
};

// Location Marker Object
var LocMarker = function(data) {
    var self = this;
    this.title = data.title;
    this.coords = new google.maps.LatLng(data.location["lat"], data.location["lng"]);
    this.position = data.location
    this.marker = new google.maps.Marker({
        position: self.coords,
        title: self.title,
        map: map
    });
};

// Initialise map, centered on Berlin, with markers ***
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -43.53205440000001, lng: 172.63622540000006 }, //Christchurch
        zoom: 10
    });

    // Start knockout
    var knockout = new koViewModel();
    ko.applyBindings(knockout);

    // get markers
    var markers = knockout.locationList.map(function(location) {
        return location.marker;
    });
}

// Knockout View Model
function koViewModel() {
    // The old `self=this` trick
    var self = this;

    // Get all locations into an array
    this.locationList = model.data.map(function(location) {
        return new LocMarker(location);
    });

    // Add click binding to location markers
    this.locationList.forEach(function(location) {
        location.marker.addListener('click', function() {
            self.clearInfoWindow();
            self.setCurrentLocation(location);
            self.infoTitle(location.title);
            self.bouncingMarker(location);
            self.centerMap();
            self.getWikiInfo();
            self.getLocInfo(location);
            self.visibleInfo(true);
        });
    });

    // Set and get current location
    this.setCurrentLocation = function(location) {
        model.currentLocation(location);
    };

    this.getCurrentLocation = function() {
        return model.currentLocation();
    };

    // check if currentLocation is set and return boolean
    this.hasCurrentLocation = ko.computed(function() {
        return self.getCurrentLocation() === null ? true : false;
    });

    this.loadCurrentLocation = function() {
        self.clearInfoWindow();
        self.setCurrentLocation(this);
        self.infoTitle(this.title);
        self.bouncingMarker(this);
        self.centerMap();
        self.getWikiInfo();
        self.getLocInfo();
        self.visibleInfo(true);
    };

    this.clearCurrentLocation = function() {
        model.currentLocation(null);
        self.visibleInfo(false);
        self.clearInfoWindow();
        self.resetMapCenter();
    };

    this.close = "close";
    this.title = "Famous parks in Christchurch, NZ";
    this.searchLabel = "Search: ";
    this.footerText = "© Dai Kikuchi 2017";
    this.githublink = "https://github.com/daikikuchi/NeighboringMap.git";

    // Observables for info window
    this.googleError = ko.observable('');
    this.infoTitle = ko.observable('');
    this.hasPhoto = ko.observable(false);
    this.locPhotoError = ko.observable('');
    this.locPhotoURI = ko.observable('');
    this.addressHeader = "Address: "
    this.address = ko.observable('');
    this.avgRatingHeader = "Average Rating: ";
    this.avgRating = ko.observable('');
    this.sampleDate = ko.observable('Loading ...');
    this.wikiHeader = "Information from Wikipedia:";
    this.wikiError = ko.observable('');
    this.wikiText = ko.observable('Loading ...');
    this.wikiReadMore = "Read more on Wikipedia";
    this.wikiLink = ko.observable('Loading ...');
    this.hasWikiLink = ko.computed(function() {
        return self.wikiLink().length > 0;
    });

    this.clearInfoWindow = function() {
        self.infoTitle('');
        self.hasPhoto(false);
        self.locPhotoError('');
        self.locPhotoURI('');
        this.address('');
        this.avgRating('');
        self.wikiError('');
        self.googleError('');
        self.wikiText('Loading ...');
        self.wikiLink('Loading ...');
    };

    // Observable for info window visibility
    this.visibleInfo = ko.observable(false);

    // Show markers of search results
    this.showMarkers = function(results) {
        var loc = self.locationList;
        for (var i = 0; i < self.locationList.length; i++) {
            var visible = results.includes(loc[i]);
            self.locationList[i].marker.setVisible(visible);
        }
    };

    // Bounce marker 3s when clicking on a location
    this.bouncingMarker = function() {
        var location = self.getCurrentLocation();
        location.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            location.marker.setAnimation(null);
        }, 2800);
    };

    // Center map on current marker
    this.centerMap = function() {
        var position = self.getCurrentLocation().marker.position;
        map.setCenter(position);
        map.setZoom(17);
    };

    this.resetMapCenter = function() {
        map.setCenter({ lat: -43.53205440000001, lng: 172.63622540000006 }); //Christchurch City
        map.setZoom(10);
    };

    // searchInput for testing
    this.searchInput = ko.observable('');

    // Empty array that should get updated when the searchLive works
    this.searchResults = ko.observableArray(this.locationList);

    // Search function
    this.searchLive = function() {
        var searchInput = self.searchInput().toLowerCase();
        var locations = self.locationList;
        var results = [];
        for (var i = 0; i < self.locationList.length; i++) {
            if ((searchInput.length > 0) && locations[i].title.toLowerCase().includes(searchInput)) {
                results.push(locations[i]);
                locations[i].marker.setVisible(true);
            } else if (searchInput.length > 0) {
                locations[i].marker.setVisible(false);
            } else {
                locations[i].marker.setVisible(true);
                results.push(locations[i]);
            }
        }
        self.searchResults(results);
    };


    // Load wiki info from location data or get from API
    this.getWikiInfo = function() {
        var location = self.getCurrentLocation();
        if (location.wikiInfo === undefined) {
            self.getWikiData(location);
        } else {
            self.loadWikiInfo(location);
        }
    };

    // Load wiki info into Observables
    this.loadWikiInfo = function(location) {
        if (location.wikiInfo.timeout !== undefined) {
            self.wikiText(location.wikiInfo.timeout);
        } else if (location.wikiInfo.err !== undefined) {
            self.wikiError(location.wikiInfo.err);
        } else {
            self.wikiText(location.wikiInfo.wikiText);
            self.wikiLink(location.wikiInfo.wikiLink);
        }
    };

    // Retrieve Wikipedia info
    this.getWikiData = function(location) {
        // set TimeOut
        var pageTitle = location.title;
        var wikiUrl = "https://en.wikipedia.org/w/api.php";
        var genError = "There is nothing found at Wikipedia.";
        wikiUrl = wikiUrl + '?' + $.param({
            'format': "json",
            'action': "query",
            'titles': pageTitle,
            'prop': "extracts",
            'exintro': 1
        });
        $.ajax({
                url: wikiUrl,
                dataType: 'jsonp'
            })
            .done(function(data) {
                location.wikiInfo = {};
                if (data.query === undefined) {
                    location.wikiInfo.err = genError;
                } else if (data.query.pages === undefined) {
                    location.wikiInfo.err = genError;
                }
                if (-1 in data.query.pages) {
                    location.wikiInfo.err = "We cannot find anything on Wikipedia"
                } else {
                    var article_url = "http://en.wikipedia.org/wiki/" + pageTitle;
                    var result = data.query.pages;
                    var extract;
                    $.each(result, function(i) {
                        extract = result[i]["extract"];
                    });
                    if (extract.length == 0) {
                        location.wikiInfo.err = genError;
                    }
                    location.wikiInfo.wikiText = extract;
                    location.wikiInfo.wikiLink = article_url;
                }
            })
            .fail(function() {
                location.wikiInfo = {};
                location.wikiInfo.err = genError;
            })
            .always(function() {
                self.loadWikiInfo(location);

            });
    };


    // Get details from location if previously retrieved, else get from
    // Google Places
    this.getLocInfo = function() {
        var location = self.getCurrentLocation();
        if (location.phoneNo === undefined) {
            self.getLocInfoData(location);
        } 
        else if (location.googleError !== undefined) {
            self.googleError(location.googleError);
        }
        else {
            self.loadLocInfo(location);
        }
    }

    // Load photo data from location
    this.loadLocInfo = function(location) {
        self.address(location.address);
        self.avgRating(location.avgRating);
        if (location.locPhoto.hasPhoto) {
            self.hasPhoto(true);
            self.locPhotoURI(location.locPhoto.photoUrl);
        }
    }

    // Get photo of the selected location using the Google Places API library
    this.getLocInfoData = function(location) {

        location.locPhoto = {};
        var place_id;
        var request = {
            location: location.coords,
            radius: '100',
            types: ['park', 'zoo']
        };
        var genError = "There is nothing found from Google API"
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, function(results, status) {
            if (status == "OK") {

                var photoUrl;
                console.log(results[0])
                    //narrow down the result to get only the first item
                if (results[0].photos !== undefined) {
                    photoUrl = results[0].photos[0].getUrl({
                        'maxWidth': 500,
                        'maxHeight': 500
                    });
                }
                if (results[0].vicinity !== undefined) {
                    location.address = results[0].vicinity;
                }

                if (results[0].rating !== undefined) {
                    location.avgRating = results[0].rating;
                }

                if (results[0].place_id !== undefined) {
                    place_id = results[0].place_id;
                }

                if (photoUrl !== undefined) {
                    location.locPhoto.hasPhoto = true;
                    location.locPhoto.photoUrl = photoUrl;
                } else {
                    location.locPhoto.hasPhoto = false;
                }

            } else {
                location.googleError = genError;
            };

            self.loadLocInfo(location);
        });
    }


    this.makeSafeURI = function(string) {
        string = string.replace(/ /g, "+");
        string = string.replace(/,/, "%2C");
        string = string.replace(/\(/, "%28");
        string = string.replace(/\)/, "%29");
        string = string.replace(/\//, "%2F");
        return string
    };
} // End ViewModel
