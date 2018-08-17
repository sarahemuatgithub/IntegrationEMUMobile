// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'


angular.module('emuMobile', ['ionic', 'ui.router', 'xml2js', 'emuMobile.services',
    'emuMobile.controllers', 'ngStorage', 'angularMoment', 'angular.filter', 'ui-notification', 'ngIdle','ngCordova'])

    .run(function ($ionicPlatform, $http, $rootScope, $q, $localStorage, AuthenticationService, UtilityService, $state, appConfig) {
        $ionicPlatform.ready(function () {

            if (window.cordova && window.cordova.plugins.Keyboard) {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                // Don't remove this line unless you know what you are doing. It stops the viewport
                // from snapping when text inputs are focused. Ionic handles this internally for
                // a much nicer keyboard experience.
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }

            //////////////////////////////////////
            //Do Not Remove
            //NOTE: This will show as as Uncaught TypeError in console
            //This is needed to close splashscreen

            if (window.cordova){
            setTimeout(function() {
                navigator.splashscreen.hide();
            }, 1000);
            }
            //////////////////////////////////////

        });

        $rootScope.canceller = $q.defer();

        $rootScope.cancelRequests = function () {
            $http.pendingRequests.forEach(function (request) {
                if (request.cancel) {
                    request.cancel.resolve();

                }
            });
            $rootScope.canceller = $q.defer();
        };

        // on restart all queries should be reset
        $rootScope.cancelRequests();
        // clear local storage
        $localStorage.$reset();

        //------- AUTOMATIC LOGOUT ON INACTIVITY - using ng-idle ---------------\\
        //https://github.com/HackedByChinese/ng-idle
        //Idle.watch() set at login, Idle.unwatch set at logout

        //start idle for inactivity logout watch
        $rootScope.$on('IdleStart', function () {
            // the user appears to have gone idle
            //console.log("idle start");
        });

        $rootScope.$on('IdleWarn', function (e, countdown) {
            // follows after the IdleStart event, but includes a countdown until the user is considered timed out
            // the countdown arg is the number of seconds remaining until then.
            // you can change the title or display a warning dialog from here.
            // you can let them resume their session by calling Idle.watch()

            var warnAtSeconds;

            if (appConfig.platform == "PROD") {
                //PRODUCTION
                warnAtSeconds = 60; //warning at 60 seconds
            }
            else {
                //DEVL & QUAL
                warnAtSeconds = 30; //waring at 30 seconds
            }

            if (countdown == warnAtSeconds) {
                UtilityService.showWarning("You will be logged out for inactivity soon.");
            }

            //TESTING
            //console.log("IdleWarn countdown = "+countdown);
            //console.log(e);
        });

        $rootScope.$on('IdleEnd', function () {
            // the user has come back from AFK and is doing stuff.
            // if you are warning them, you can use this to hide the dialog

            //TESTING
            //console.log("idleEnd");
            //console.log("close any notification messages here");

            UtilityService.clearMsgs();
        });

        $rootScope.$on('Keepalive', function () {
            // do something to keep the user's session alive
            
            //TESTING
            //console.log("keepalive");
        });

        $rootScope.$on('IdleTimeout', function () {
            // the user has timed out (meaning idleDuration + timeout has passed without any activity)
            // this is where you'd log them

            //TESTING
            //console.log("IdleTimeout, log out here");

            AuthenticationService.logout().then(
                function (response) {

                    //TESTING
                    //console.log("logout response");
                    //console.log(response);

                    AuthenticationService.ClearCredentials();
                    // clear local storage
                    $localStorage.$reset();
                    UtilityService.showError("Logged out due to inactivity.");
                    $state.go('home', {}, {reload: true}); //go to home and/or refresh home to shot Lock(s) after Logout
                }, function (error) {
                    UtilityService('Problem with logout.  Please notify help desk.');
                    console.log("Error in Logout from Idle" + error);
                }
            );
        });
        //------- End AUTOMATIC LOGOUT ON INACTIVITY ---------------\\
    })

    .config(function (IdleProvider, KeepaliveProvider, appConfig) {
        // Configure Idle settings
        if (appConfig.platform == "PROD") {
            //PRODUCTION
            IdleProvider.idle(60); // in seconds --IDLE FOR 1 MINUTE
            IdleProvider.timeout(600); // in seconds --TIMEOUT AFTER 10 MINUTES
            KeepaliveProvider.interval(2); // in seconds
        }
        else {
            //DEVL & QUAL - Long
            IdleProvider.idle(60); // in seconds --IDLE FOR 1 MINUTE
            IdleProvider.timeout(600); // in seconds -TIMEOUT AFTER 2 MINUTES
            KeepaliveProvider.interval(2); // in seconds
        }
    })

    .config(function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|tel|ftp|blob):|data:image\//);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|file|tel|ftp|blob):|data:image\//);
    })

    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('APIInterceptor');
    }])

    .config(function (NotificationProvider) {
        NotificationProvider.setOptions({
            delay: 4000,
            maxCount: 1,
            positionX: 'center',
            positionY: 'top'
        });
    })

    .config(['$ionicConfigProvider', function ($ionicConfigProvider) {
        $ionicConfigProvider.tabs.position('bottom'); // other values: top
        // http://stackoverflow.com/questions/29098079/how-to-disable-change-animation-between-views-in-ion-nav-view
        $ionicConfigProvider.views.transition('none');

        //center text on navbar
        $ionicConfigProvider.navBar.alignTitle('center');
    }])

    .constant("appConfig", {
        //http://mobile.elluciancloud.com/mobilecloud/api/liveConfigurations
        //Eastern Michigan University 608
        //https://mobile.elluciancloud.com/mobilecloud/api/liveConfigurations/608

        //DEVL
        //"platform": "DEVL",
        //"configId": "24457",  // test server
        //"mobileApiUrl": "https://elluciangotest.emich.edu/banner-mobileserver",
        //QUAL
        //"platform": "QUAL",
        //"configId": "23487",   // qual server
        //"mobileApiUrl": "https://elluciangoqual.emich.edu/banner-mobileserver",
        //PROD - Release Version 1.0+ to use these settings
        "platform": "PROD",
        "configId": "23891",   // prod server - need to find this
        "mobileApiUrl": "https://elluciangoprod.emich.edu/banner-mobileserver"

    })

    .config(function ($stateProvider, $urlRouterProvider, $httpProvider, $ionicConfigProvider) {

        $ionicConfigProvider.tabs.position('top');
        $urlRouterProvider.otherwise('/home');

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: 'templates/home.html',
                controller: 'HomeCtrl'
            })

            .state('test', {
                url: '/test',
                templateUrl: 'templates/test.html',
                controller: 'TestCtrl'
            })

            .state('about', {
                url: '/about',
                templateUrl: 'templates/about.html',
                controller: 'AboutCtrl'
            })

            .state('login', {
                url: "/login/:action/",
                templateUrl: 'templates/applogin.html',
                controller: 'LoginCtrl'
            })

            .state('studentfinancials', {
                url: '/finances',
                templateUrl: 'templates/student_financials.html',
                controller: 'StudentFinancialsCtrl'
            })

            .state('studentmenu', {
                url: '/studentmenu',
                templateUrl: 'templates/student_menu.html',
                controller: 'StudentMenuCtrl'
            })

            .state('studentgrades', {
                url: '/studentgrades',
                templateUrl: 'templates/student_grades.html',
                controller: 'StudentGradesCtrl'
            })

            .state('studentcourses', {
                url: '/studentcourses',
                templateUrl: 'templates/student_courses.html',
                controller: 'StudentCoursesCtrl'
            })


            .state('socialmenu', {
                url: '/socialmenu',
                templateUrl: 'templates/social_menu.html',
                controller: 'SocialMenuCtrl'
            })

            .state('campusmenu', {
                url: '/campusmenu',
                templateUrl: 'templates/campus_menu.html',
                controller: 'CampusMenuCtrl'
            })

            .state('importantnumbers', {
                url: '/importantnumbers',
                templateUrl: 'templates/numbers.html',
                controller: 'CampusNumbersCtrl'
            })

            .state('directory', {
                url: '/directory',
                templateUrl: 'templates/directory.html',
                controller: 'DirectoryCtrl'
            })

            .state('events', {
                url: '/events',
                templateUrl: 'templates/events.html',
                controller: 'EventsCtrl'
            })

            .state('feeds', {
                url: '/feeds',
                templateUrl: 'templates/feeds.html',
                controller: 'FeedsCtrl'
            })

            .state('maps', {
                url: '/maps',
                templateUrl: 'templates/maps.html',
                controller: 'MapCtrl'
            })
			
            .state('qlinkmenu', {
                url: '/qlinkmenu',
                templateUrl: 'templates/qlink_menu.html',
                controller: 'QlinkMenuCtrl'
            })
			
            .state('newseventsmenu', {
                url: '/newseventsmenu',
                templateUrl: 'templates/news_events_menu.html',
                controller: 'NewsEventsMenuCtrl'
            })
			
            .state('reg', {
                url: "/reg",
                abstract: true,
                templateUrl: "templates/registrationtabs.html"
            })

            .state('reg.search', {
                url: '/search',
                views: {
                    'tab-search': {
                        templateUrl: 'templates/reg_search.html',
                        controller: 'RegistrationCtrl'
                    }
                }
            })

            .state('reg.section_detail', {
                url: '/reg_section_detail/:course',
                views: {
                    'tab-search': {
                        templateUrl: 'templates/reg_section_detail.html',
                        controller: 'SectionDetailCtrl'
                    }
                }
            })

            .state('reg.search_results', {
                url: '/searchresults',
                views: {
                    'tab-search': {
                        templateUrl: 'templates/reg_search_results.html',
                        controller: 'RegistrationSearchResultCtrl'
                    }
                }
            })

            .state('reg.cart', {
                url: '/cart',
                views: {
                    'tab-cart': {
                        templateUrl: 'templates/reg_cart.html',
                        controller: 'RegistrationCartCtrl'
                    }
                }
            })

            .state('reg.reg_checkout', {
                url: '/reg_checkout',
                views: {
                    'tab-cart': {
                        templateUrl: 'templates/reg_checkout.html',
                        controller: 'RegCheckoutCtrl'
                    }
                }
            })
            .state('blackboard', {
                url: '/qlinkmenu/blackboard',
                templateUrl: 'templates/blackboard.html',
                controller: 'BlackBoardCtrl'
                 
            })
    });