angular.module('emuMobile.controllers', ['ngCordova'])

.controller('BlackBoardCtrl', function($scope,$ionicPlatform) {
    var appId = "";
  
      var appId, appStarter = "";
      alert(ionic.Platform);
      $ionicPlatform.ready(function() {
      if (ionic.Platform.isAndroid()) {
          // plugin com.lampa.startapp
          appId = 'com.blackboard.android.bbstudent';
          appStarter = startApp.set({"application": appId});
          appStarter.start(function(msg) {
              console.log('starting BB app: ' + msg);
          }, function(err) {
              console.log('BB app not installed', err);
              window.open('market://details?id=com.blackboard.android.bbstudent', '_system');
          });
      } else {
          if (ionic.Platform.isIOS() || ionic.Platform.isIPad()) {
              appId = 'blackboard://';
         
              appStarter = startApp.set(appId);
              appStarter.start(function(msg) {
                  console.log('starting BB app: ' + msg);                
              }, function(err) {
                  console.log('BB app not installed', err);
                  window.open('itms-apps://itunes.apple.com/us/app/blackboard/id950424861?mt=8', '_system');
                });
          }
      }
    })
})
    .controller('AboutCtrl', function ($state, $scope, appConfig, AuthenticationService, $http, UtilityService) {
        $scope.AppVersion = '1.0.1';

        $scope.user = {
            imageId: null,
            username: null
        };

        $scope.platform = function () {

            if (angular.isDefined(appConfig.platform)) {
                return appConfig.platform;
            }
            else {
                return "appConfig.platform undefined, bad server";
            }
        };

        $scope.$on('$ionicView.enter', function (event, args) {
            $scope.user = {
                imageId: AuthenticationService.currentUser().authId,
                username: AuthenticationService.currentUser().userId
            };

            //AppVersion defined from config.xml
            //TODO: use this for PRODUCTION to show application version, remove hand entered version from about.html
            //NOTE: this will only show on a device, will not show in browser since this is using cordova
            if (window.cordova) {
                cordova.getAppVersion.getVersionNumber(function (value) {
                    $scope.AppVersion = value;
                });
            }
        })
    })

    .controller('LoginCtrl', function ($state, $scope, $timeout, $stateParams, $localStorage, UtilityService, AuthenticationService, RegistrationService, Idle) {
        $scope.credentials = {};
        var action = "";

        //TESTING
        //console.log("LoginCtrl");

        var logout = function () {
            //$scope.logout = function () {
            //TESTING
            //console.log('login logout');

            AuthenticationService.logout().then(
                function (response) {
                    AuthenticationService.ClearCredentials();
                    $scope.credentials = {};
                    // clear local storage
                    $localStorage.$reset();
                    RegistrationService.setAltPin();
                    Idle.unwatch();
                    UtilityService.showSuccess("Logged out.");
                }, function (error) {

                    //TESTING
                    //console.log("Error in Logout " + error);

                    UtilityService('Problem with logout.  Please notify help desk.');
                }
            )
        };

        $scope.login = function () {

            //TESTING
            //console.log("login loading..");

            UtilityService.showLoading('Authenticating...');

            //TESTING
            //console.log('CONTROLLER $scope.login start');

            AuthenticationService.login($scope.credentials.username, $scope.credentials.password).then(
                function (response) {

                    //TESTING
                    //console.log("login response");
                    //console.log(response);

                    if (response.status == 0) { // timeout
                        if (AuthenticationService.isLoggedIn() == false) {

                            //TESTING
                            //console.log("CONTROLLER login Auth login time out");
                            //console.log(response);

                            UtilityService.showError('Unable to authenticate, Username or Password Incorrect.  Please retry.');
                        }
                    }

                    // Ellucian bug with logout
                    if (response.data.authId != $scope.credentials.username) {
                        UtilityService.showError("Problem with login, please contact help desk");
                        AuthenticationService.ClearCredentials();
                        $state.go('login');
                    } else {
                        AuthenticationService.setCredentials(response);
                        Idle.watch();
                        $state.go('home');
                        //TESTING
                        //console.log("login finished");
                    }
                },
                function (error) {
                    UtilityService.showError("Authentication Error: " + error);
                }
            )
                .finally(function () {
                    //TESTING
                    //console.log("login finally");
                    UtilityService.hideLoading();
                })
        };

        $scope.gohome = function () {
            //TESTING
            //console.log('login gohome');
            $state.go('home');
        };

        // catch interceptor message
        $scope.$on('unauthorized', function (event, args) {
            //TESTING
            //console.log("login unauthorized");
            UtilityService.showError(args.message);
        });

        $scope.$on('$ionicView.enter', function (event, args) {
            if (args.stateParams.action.toUpperCase() == 'LOGOUT') {
                //TESTING
                //console.log("onenter logout");
                logout();
            }
        });

        $scope.$on('$ionicView.leave', function () {
            //TESTING
            //console.log("logout hideloading");
            UtilityService.hideLoading();
        });
        // response for login on a 401 from interceptor or home. should i add 403
    })

    .controller('HomeCtrl', function ($state, $scope, UtilityService, $ionicModal, AuthenticationService) {

        $scope.credentials = {};
        $scope.model = {
            authText: null
        };

        $scope.showLock = function () {
            //TESTING
            //console.log("showLock");
            return $scope.model.authText == 'Login';
        };

        $scope.showStudentMenu = function () {
            if (AuthenticationService.isLoggedIn() == false) {
                //TESTING
                //console.log("not logged in going to modal");

                //open new page here for LOGIN, dont use state
                //or open popover so this isn't called twice

                $state.go('login', {action: "login"});
                //$state.go('login');
            } else {
                //TESTING
                //console.log("logged in, going to studentmenu");
                $state.go("studentmenu");
            }
        };

        $scope.authAction = function () {
            //TESTING
            //console.log("authAction");
            //$state.go('login');

            $state.go('login', {action: $scope.model.authText});
        };

        $scope.$on('$ionicView.enter', function () {
            if (AuthenticationService.isLoggedIn() == false) {
                $scope.model.authText = "Login"
            } else {
                $scope.model.authText = "Logout";
            }
        })
    })

    .controller('StudentFinancialsCtrl', function ($scope, StudentService, AuthenticationService) {
        $scope.balance = 0;
        $scope.transactions = [];
        var getBalance = function () {

            StudentService.balances().then(
                function (response) {
                    $scope.balance = response.data.terms[0].balance == null ? 0 : response.data.terms[0].balance;
                    $scope.description = response.data.terms[0].description;
                },
                function (error) {

                    //TESTING
                    //console.log("Error in Balances " + error);
                }
            )
        };

        var getTransactions = function () {
            StudentService.transactions().then(
                function (response) {
                    if (response.data.terms.length > 0) {
                        // StudentAPI returns single term
                        $scope.transactions = response.data.terms[0];
                        $scope.description = response.data.terms[0].description;
                    }
                },
                function (error) {

                    //TESTING
                    //console.log("Error in getTransactions " + error);
                }
            )
        };

        // get finances on entry
        $scope.$on('$ionicView.enter', function () {
            if (AuthenticationService.isLoggedIn()) {
                getBalance();
                getTransactions();
            }
        })
    })

    // show course info, schedule, etc.
    .controller('StudentMenuCtrl', function ($scope, $state, UtilityService, StudentService, RegistrationService, AuthenticationService) {
        $scope.balance = 0;
        $scope.description = "Balance: ";
        var hasRegTerms = false;

        var initFinances = function () {

            StudentService.balances().then(
                function (response) {
                    $scope.balance = response.data.terms[0].balance == null ? 0 : response.data.terms[0].balance;
                    $scope.description = response.data.terms[0].description;
                },
                function (error) {

                    //TESTING
                    //console.log("Error in intiFinances " + error);
                }
            )
        };

        var initRegisterableTerms = function () {
            UtilityService.showLoading("Loading...");

            RegistrationService.terms().then(
                function (response) {

                    //TESTING
                    //console.log("StudentMentuCtrl - check for registerable terms");
                    //console.log(response);

                    $scope.terms = response.data.terms;
                    hasRegTerms = ($scope.terms.length > 0);

                    //TESTING
                    //console.log("StudentMentuCtrl - hasRegTerms");
                    //console.log(hasRegTerms);
                    //hasRegTerms = true;

                    if (hasRegTerms == true) {
                        $state.go("reg.search");
                    }
                },
                function (error) {

                    //TESTING
                    //console.log('Error in initRegisterableTerms' + error);

                    hasRegTerms = false;
                }
            ).finally(function () {
                if (hasRegTerms == false) {
                    UtilityService.showError("Student has no registrable terms")
                }
                UtilityService.hideLoading();
            })
        };

        $scope.canRegister = function () {
            initRegisterableTerms();
        };

        // get finances on entry
        $scope.$on('$ionicView.enter', function () {
            if (AuthenticationService.isLoggedIn()) {
                initFinances();
            }
        })
    })

    .controller('StudentGradesCtrl', function ($scope, $ionicPopover, StudentService, UtilityService) {
        $scope.terms = [];
        $scope.student = {};
        //$scope.selectedTerm;
        var termId = null;

        ////////////////// StudentGradesCtrl popover ////////////////
        // .fromTemplate() method
        $scope.title = {name: "Select Term"};
        var template = '<ion-popover-view>' +
            '<ion-header-bar> ' +
            '<h1 class="title">{{title.name}}</h1> ' +
            '</ion-header-bar> ' +

            '<ion-radio ng-repeat="term in terms" ng-value="term" ng-checked="search.selectedTerm" ng-click="updateSelectedTerm(search.selectedTerm)" ng-model="search.selectedTerm">' +
            '{{term.name}}' +
            '</ion-radio>' +
            '</ion-popover-view>';

        $scope.popover = $ionicPopover.fromTemplate(template, {
            scope: $scope
        });

        $scope.openPopover = function ($event) {
            //click event instantiates popover from button
            $scope.popover.show($event);
        };

        $scope.closePopover = function () {
            $scope.popover.hide();
        };

        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.popover.remove();
        });

        // Execute action on hide popover
        $scope.$on('popover.hidden', function () {
            // Execute action
            //this is for close - when clicked off of modal
            //console.log('close'); //TESTING
        });

        // Execute action on remove popover
        $scope.$on('popover.removed', function () {
            // Execute action
        });
        ////////////////// End StudentGradesCtrl popover ////////////////

        $scope.selectTerm = function (value) {
            $scope.selectedTerm = value;
        };

        var init = function () {

            //TESTING
            //console.log("initializing grades");

            UtilityService.showLoading('Loading...');
            StudentService.grades(termId).then(
                function (response) {
                    $scope.terms = response.data.terms;
                    $scope.student = response.data.student;
                    $scope.selectedTerm = $scope.terms[0];
                },
                function (error) {

                    //TESTING
                    //console.log("Error in init " + error);
                }
            )
                .finally(function () {
                    UtilityService.hideLoading();
                })
        };

        $scope.cancel = function () {
            StudentService.cancel("cancelled");
        };

        $scope.$on('$ionicView.enter', function () {
            init();
        });
        $scope.$on('$ionicView.leave', function () {
            UtilityService.hideLoading();
        })
    })

    .controller('StudentCoursesCtrl', function ($scope, $ionicPopover, StudentService, $ionicModal, UtilityService) {
        $scope.terms = [];
        //$scope.selectedTerm;
        var activeView = "";
        $scope.closeModal = function () {
            $scope.modal.hide();
        };

        ////////////////// Term StudentCourses popover////////////////
        // .fromTemplate() method
        $scope.title = {name: "Select Term"};
        var template = '<ion-popover-view>' +
            '<ion-header-bar> ' +
            '<h1 class="title">{{title.name}}</h1> ' +
            '</ion-header-bar> ' +

            '<ion-radio ng-repeat="term in terms" ng-value="term" ng-checked="selectedTerm" ng-click="updateCourseSelectedTerm(term)" ng-model="search.selectedTerm">' +
            '{{term.name}}' +
            '</ion-radio>' +
            '</ion-popover-view>';

        $scope.popover = $ionicPopover.fromTemplate(template, {
            scope: $scope
        });

        $scope.openPopover = function ($event) {
            //click event instantiates popover from button
            $scope.popover.show($event);
        };

        $scope.closePopover = function () {
            $scope.popover.hide();
        };

        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.popover.remove();
        });

        // Execute action on hide popover
        $scope.$on('popover.hidden', function () {
            // Execute action
            //this is for close - when clicked off of modal
            //console.log('close'); //TESTING
        });

        // Execute action on remove popover
        $scope.$on('popover.removed', function () {
            // Execute action
        });

        //hook this up to ng-click="updateSelectedTerm(search.selectedTerm)"
        //on ion-radio control above
        $scope.updateCourseSelectedTerm = function (term) {

            //TESTING
            //console.log($scope.search.selectedTerm);
            //console.log(term);

            //set the tern and filter
            //RegistrationService.setActiveTerm($scope.search.selectedTerm);
            $scope.closePopover();
        };
        ////////////////// End Term StudentCourses popover////////////////

        //STUDENT COURSES - HISTORY
        var initFullView = function () {
            StudentService.coursesfullview().then(
                function (response) {
                    $scope.terms = response.data.terms;
                    $scope.selectedTerm = $scope.terms[0];
                },
                function (error) {

                    //TESTING
                    //console.log("Error in initFullView " + error);
                }
            ).finally(function () {
                UtilityService.hideLoading();
            })
        };

        //STUDENT COURSES - SCHEDULE
        var initDailyView = function () {
            StudentService.courses().then(
                function (response) {

                    //TESTING
                    //console.log('TESTING initDailyView');
                    //console.log(response);

                    $scope.coursesDays = response.data.coursesDays;

                    //TESTING
                    //console.log('TESTING coursesDays');
                    //console.log($scope.coursesDays);
                    //console.log(response.data.courseDays);
                },
                function (error) {

                    //TESTING
                    //console.log("Error in initDailyView " + error);

                }
            ).finally(function () {
                UtilityService.hideLoading();
            })
        };

        var init = function () {

            //TESTING
            //console.log("TESTING initializing courses");

            $scope.setView('dailyview');
        };

        $scope.getActiveView = function () {

            //TESTING
            //console.log('active view is not set when this fires the first time, gives 404 error'); //TESTING
            //console.log("studentCoursesCtrl getActiveView");
            //Sconsole.log("if activeView not set then this will error");

            //TODO: fix delivery of this on student_courses.html, no partial on init
            //TODO: this is called 6 times using the method and ng-include on student_courses.html

            return "templates/partials/" + activeView + ".html";
        };

        $scope.setView = function (view) {
            activeView = view;
            UtilityService.showLoading('Loading');
            switch (view) {
                case 'fullview':
                    initFullView();
                    break;
                case 'dailyview':
                    initDailyView();
                    break;
                default:
                    $scope.setView('fullview');
            }
        };

        $scope.cancel = function () {
            StudentService.cancel("cancelled");
        };

        $scope.$on('$ionicView.enter', function () {

            //TESTING
            //console.log("studentCoursesCtrl INIT on Enter");

            init();
        });
        $scope.$on('$ionicView.leave', function () {
            UtilityService.hideLoading();
        })
    })

    .controller('CampusMenuCtrl', function ($scope, $state, AuthenticationService) {
        $scope.showDirectory = function () {
            if (AuthenticationService.isLoggedIn() == false) {
                $state.go('login', {action: "login"})
            } else {
                $state.go("directory");
            }
        };

        $scope.loggedIn = function () {
            return AuthenticationService.isLoggedIn();
        }
    })

    .controller('SocialMenuCtrl', function ($scope) {
        $scope.open = function (url) {
            cordova.InAppBrowser.open(url, '_blank', 'location=yes');
        }
    })

    .controller('QlinkMenuCtrl', function ($scope) {
        $scope.open = function (url) {
            cordova.InAppBrowser.open(url, '_blank', 'location=yes');
        }
    })

    .controller('NewsEventsMenuCtrl', function ($scope) {
        $scope.open = function (url) {
            cordova.InAppBrowser.open(url, '_blank', 'location=yes');
        }
    })
	
    //use for Test.html
    .controller('TestCtrl', function ($scope) {
        /* Set the width of the side navigation to 250px */
        $scope.openNav = function openNav() {
            document.getElementById("mySidenav").style.width = '250px';
        };

        /* Set the width of the side navigation to 0 */
        $scope.closeNav = function closeNav() {
            document.getElementById("mySidenav").style.width = "0";
        };

        /*used for list of buildings*/
        //{{$index}}.) {{item.name}}

        $scope.resultSet =
            [
                {"name": "one"},
                {"name": "two"},
                {"name": "three"},
                {"name": "four"},
                {"name": "five"},
                {"name": "six"},
                {"name": "seven"},
                {"name": "eight"},
                {"name": "nine"},
                {"name": "ten"},
                {"name": "eleven"},
                {"name": "twelve"},
                {"name": "thirteen"},
                {"name": "fourteen"},
                {"name": "fifteen"},
                {"name": "sixteen"},
                {"name": "seventeen"},
                {"name": "eighteen"},
                {"name": "nineteen"},
                {"name": "twenty"}
            ];

        //group by
        //https://github.com/a8m/angular-filter#groupby

        $scope.searchResults =
            [
                {
                    "type": "Student",
                    "displayName": "Grover Bellanger",
                    "firstName": "Grover",
                    "lastName": "Bellanger"
                },
                {
                    "type": "Student",
                    "displayName": "Douglas Grover",
                    "firstName": "Douglas",
                    "lastName": "Grover",
                    "email": "dgrover@emich.edu"
                },
                {
                    "type": "Student",
                    "displayName": "Gary Grover",
                    "firstName": "Gary",
                    "lastName": "Grover"
                },
                {
                    "type": "Student",
                    "displayName": "Holly Grover",
                    "firstName": "Holly",
                    "lastName": "Grover"
                },
                {
                    "type": "Student",
                    "displayName": "Randall Grover",
                    "firstName": "Randall",
                    "lastName": "Grover",
                    "email": "rgrover2@emich.edu"
                },
                {
                    "type": "Student",
                    "displayName": "Robin Grover",
                    "firstName": "Robin",
                    "lastName": "Grover",
                    "email": "bluehallcats@yahoo.com"
                },
                {
                    "type": "Student",
                    "displayName": "Sahab Grover",
                    "firstName": "Sahab",
                    "lastName": "Grover",
                    "email": "sgrover2@emich.edu"
                },
                {
                    "type": "Student",
                    "displayName": "Sareeka Grover",
                    "firstName": "Sareeka",
                    "lastName": "Grover"
                },
                {
                    "type": "Faculty",
                    "displayName": "Ms Shucha Grover",
                    "firstName": "Shucha",
                    "lastName": "Grover",
                    "email": "sgrover1@emich.edu"
                },
                {
                    "type": "Student",
                    "displayName": "Shucha Grover",
                    "firstName": "Shucha",
                    "lastName": "Grover",
                    "email": "shuchagrover@gmail.com"
                }
            ]
    })

    .controller('DirectoryCtrl', function ($scope, DirectoryService, UtilityService) {

        $scope.search = {term: null};

        $scope.doDirectorySearch = function () {

            if ($scope.search.term == null) {
                UtilityService.showError("Name cannot be blank, please enter a name to search...")
            }
            else {
                UtilityService.showLoading("Searching...");
                DirectoryService.search($scope.search.term).then(
                    function (response) {

                        //TESTING
                        //console.log("doDirectorySearch response");
                        //console.log(response); //404 from apache here

                        $scope.searchResults = response.data;
                    },
                    function (error) {

                        //TESTING
                        //console.log("doDirectorySearch ERROR");
                        //console.log(error.message);

                        $scope.searchResults = [];
                    }
                ).finally(function () {
                    UtilityService.hideLoading();
                });
            }
        };

        $scope.$on('$ionicView.leave', function () {
            UtilityService.hideLoading();
        })

    })

    .controller('EventsCtrl', function ($scope, UtilityService, $ionicModal, EventsService, moment) {
        // TODO: these two should be cached
        var eventsObj = {};     // object containing events returned from service endpoint
        var currentDate = new moment();
        $scope.monthTitle = currentDate.format('MMMM');
        $scope.currentEvents = [];


        $scope.noPrevMonth = function () {
            var cdate = currentDate.clone();
            return cdate.subtract(1, 'months').format('YYYY-MM') < new moment().format('YYYY-MM');
        };

        $scope.prevMonth = function () {
            currentDate.subtract(1, 'months');
            $scope.monthTitle = currentDate.format('MMMM');
            //var moyear = d.getFullYear().toString() + "-"+ ("0"+(d.getMonth()+1)).slice(-2)
            getCurrentEvents(currentDate.format('YYYY-MM'));
        };

        $scope.nextMonth = function () {
            currentDate.add(1, 'months');
            $scope.monthTitle = currentDate.format('MMMM');
            //var moyear = d.getFullYear().toString() + "-"+ ("0"+(d.getMonth()+1)).slice(-2)
            getCurrentEvents(currentDate.format('YYYY-MM'));
        };

        var getCurrentEvents = function (moKey) {
            var keyStr;
            $scope.currentEvents = [];
            for (var key in eventsObj) {
                keyStr = key.toString();
                if (keyStr.startsWith(moKey)) {
                    $scope.currentEvents.push({key: keyStr, value: eventsObj[key]})
                }
            }
        };

        // inital load of events from backend.  maybe put this in service?
        var getEvents = function () {
            UtilityService.showLoading('Loading...');
            EventsService.events().then(
                function (response) {
                    eventsObj = response.data;
                    getCurrentEvents(currentDate.format('YYYY-MM'));
                },
                function (error) {

                    //TESTING
                    //console.log('Error in getEvents ' + error);
                }
            ).finally(function () {
                UtilityService.hideLoading();
            });
        };

        $scope.showEventDetail = function (event) {
            $scope.currentEvent = event;
            $scope.modal.show();
        };
        $scope.closeModal = function () {
            $scope.modal.hide();
        };

        $scope.$on('$ionicView.enter', function () {
            getEvents();
        });
        $scope.$on('$ionicView.leave', function () {
            UtilityService.hideLoading();
        });

        $ionicModal.fromTemplateUrl('templates/modals/eventModal.html', function ($ionicModal) {
            $scope.modal = $ionicModal;
        }, {
            scope: $scope,
            animation: 'slide-in-up'
        });
    })

    .controller('AthleticsMenuCtrl', function ($scope) {
        $scope.menuName = "Athletics";
    })

    .controller('AthleticsScheduleCtrl', function ($scope, xmlservice, $filter) {

        var baseFeed = "http://www.emueagles.com/calendar.ashx/calendar.rss?sport_id="; //7

        // this should be from an ini file, probably filtered furthre from preferences
        var feeds = [
            {name: "Football", id: 7},
            {name: "Men's Baseball", id: 2}
        ];

        var selectedFeed = feeds[0];

        var init = function () {
            $ionicLoading.show({
                content: 'Loading',
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 200,
                showDelay: 0
            });
            var url = baseFeed + selectedFeed.id;
            xmlservice.get(url).then(function (response) {

                // check if response data is a XML document
                if (response.headers('Content-Type').match(/xml/)) {

                    // convert response data to XML to javascript object
                    var xml = $filter('text2xml')(response.data),
                        json = $filter('xml2js')(xml);

                    response.data = json.rss.channel.item;
                }

                $scope.currentfeed = response.data;
                $ionicLoading.hide();
            });
        };

        init();
    })

    .controller('FeedsCtrl', function ($scope, $ionicModal, UtilityService, FeedService) {

        $ionicModal.fromTemplateUrl('templates/modals/feedModal.html', function ($ionicModal) {
            $scope.modal = $ionicModal;
        }, {
            // Use our scope for the scope of the modal to keep it simple
            scope: $scope,
            // The animation we want to use for the modal entrance
            animation: 'slide-in-up'
        });

        $scope.showFeedDetail = function (feed) {
            $scope.currentFeed = feed;
            $scope.modal.show();
        };
        $scope.closeModal = function () {
            $scope.modal.hide();
        };

        var feeds = [];
        $scope.feed = [];
        $scope.feednames = [];
        $scope.selectedfeed = "";

        var setFeedNames = function (feedlist) {
            $scope.feednames = [];
            for (var i = 0; i < feedlist.length; i++) {
                var feed = feedlist[i];
                if ($scope.feednames.indexOf(feed.feedName) < 0) {
                    $scope.feednames.push(feed.feedName);
                }
            }
            $scope.selectedfeed = $scope.feednames[0];
        };

        $scope.getSelectedFeed = function () {
            $scope.feed = [];
            for (var i = 0; i < feeds.length; i++) {
                var feeditem = feeds[i];
                if (feeditem.feedName == $scope.selectedfeed) {
                    $scope.feed.push(feeditem);
                }
            }
        };

        $scope.snippet = function (content) {
            return content.substr(0, 80);
        };

        $scope.feedlink = function (linkarray) {
            return link[0];
        };

        var init = function () {

            //TESTING
            //console.log("initializing feeds");

            UtilityService.showLoading('Loading...');
            FeedService.parseFeed().then(function (response) {
                $scope.feed = response.entries;
                setFeedNames($scope.feed);
            })
                .finally(function () {
                    UtilityService.hideLoading();
                });
        };

        $scope.$on('$ionicView.enter', function () {
            init();
        });
        $scope.$on('$ionicView.leave', function () {
            UtilityService.hideLoading();
        })
    })

    .controller('MapCtrl', function ($scope, MapService, $ionicPopup, $ionicPopover, $timeout) {
        //TODO: Remove $ionicScrollDelegate if doing side menu
        //TODO: Implement uiGmapGoogleMapApi and remove APIKEY from index.html
        //TODO: Open InfoWindow for EMU on Init()
        //TODO: remove campus marker when location services active

        //this will insert into the maps.html page
        //TODO: add debug google api string
        /*$scope.myHTML = 'debug'; //used for debugging*/

        //TODO: add continuous geolocation api amd enableHighAccuracy

        //sidenav
        $scope.openNav = function openNav() {
            document.getElementById("mySidenav").style.width = "90%";
        };

        /* Set the width of the side navigation to 0 */
        $scope.closeNav = function closeNav() {
            document.getElementById("mySidenav").style.width = "0";
        };

        /*'I am an <code>HTML</code>string with ' +
         '<a href="#">links!</a> and other <em>stuff </em>';*/

        /*uiGmapGoogleMapApi.then(function (maps) {
         $scope.map = {center: {latitude: 45, longitude: -73}, zoom: 8};
         });*/
        var map;
        var directionsService = new google.maps.DirectionsService();

        //Campus JSON only has bounds with NW lat/long and SE lat/long, no center
        //var myLatLng = {lat: 42.2495, lng: -83.6250};  //this is the approximate campus center
        var campusLat = 42.2498;
        var campusLng = -83.6238;
        var campusName = 'Eastern Michigan University';

        /*    // .fromTemplate() method
         var template = '<ion-popover-view><ion-header-bar> <h1 class="title">My Popover Title</h1> </ion-header-bar> <ion-content> Hello! </ion-content></ion-popover-view>';

         $scope.popover = $ionicPopover.fromTemplate(template, {
         scope: $scope
         });*/

        $scope.DirectionList = [
            {text: "Walking", checked: false},
            {text: "Driving", checked: false}
        ];

        $scope.updateSelection = function (itemname) {
            if (itemname.checked == false) {
                angular.forEach(itemname, function (subscription, index) {
                    if (position != index) {
                        //alert("unchecking");
                        subscription.checked = false;
                    }
                    //change selected mode here
                    itemname.checked = true;
                });
            } else {
                itemname.checked = false;
            }

            $timeout(function () {
                $scope.popover.hide(); //close the popup after 3 seconds for some reason
                //alert(DirectionList[position].text.toUpperCase());
                //call direction here
                //alert("call directions here "+itemname);
                //myLocation();

                if (directionsDisplay) {
                    directionsDisplay.setDirections({routes: []});  //clear route and set for redraw
                }
                directionsDisplay = new google.maps.DirectionsRenderer();
                directionsDisplay.setMap(map);

                //myLocation(); //need location before direction can be called

                myDirection(itemname.toUpperCase());

            }, 250);
        };

        // .fromTemplateUrl() method
        $ionicPopover.fromTemplateUrl('templates/menu.html', {
            scope: $scope
        }).then(function (popover) {
            $scope.popover = popover;
            //popover.show(".ion-arrow-move");
        });

        $scope.openPopover = function ($event) {
            //click event for popover
            $scope.popover.show($event);
        };

        $scope.closePopover = function () {
            $scope.popover.hide();
        };

        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.popover.remove();
        });

        // Execute action on hide popover
        $scope.$on('popover.hidden', function () {
            // Execute action
        });

        // Execute action on remove popover
        $scope.$on('popover.removed', function () {
            // Execute action
        });

        /*toggleGeolocation(  )*/

        $scope.toggleGeolocation = function () {
            //this will toggle the button text
            //document.getElementById('GeoButton').innerText = 'Geolocation: ON';

            //alert (document.getElementById('powerbutton').className);
            //this works in ios
            //document.getElementById('powerbutton').className = "ion-plus-circled";

            //ios not changing
            //use red/green icon for on/off so the position won't change
            if (document.getElementById('powerbutton').className == "ion-minus-circled") {


                var optn = {
                    enableHighAccuracy: true,
                    timeout: Infinity, /*300000 is 5 minutes*/
                    maximumAge: 0
                };
                watchID = navigator.geolocation.watchPosition(success, geo_error, optn);

                //https://chadkillingsworth.github.io/geolocation-marker/
                //var GeoMarker = new GeolocationMarker(map);
            } else {

                if (watchID) {
                    navigator.geolocation.clearWatch(watchID);
                }
                document.getElementById('powerbutton').style.color = "indianred";
                document.getElementById('powerbutton').className = "ion-minus-circled";

            }

            function geo_error(err) {

                //TESTING
                //console.warn('ERROR(' + err.code + '): ' + err.message);
            }

            function success(position) {

                //TODO: only turn green is geolocation is able to turn on
                document.getElementById('powerbutton').style.color = "limegreen";
                document.getElementById('powerbutton').className = "ion-plus-circled";

                //update position here
                //check in console if
                var crd = position.coords;
                //use getCurrentPosition()
                // getPosition();
                getPosition();
            }

            //powerbutton
        };

        function initMap() {
            directionsDisplay = new google.maps.DirectionsRenderer();
            map = new google.maps.Map(document.getElementById('map'), {
                //center: myLatLng,
                center: {lat: campusLat, lng: campusLng},
                zoom: 15,
                streetViewControl: false,  //enable disable the orange man / pegman / street view draggable
                mapTypeControl: true,
                mapTypeControlOptions: {
                    //position: google.maps.ControlPosition.TOP_LEFT,
                    //style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                    //style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    //position: google.maps.ControlPosition.TOP_CENTER,
                    //mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE]
                    mapTypeIds: []  //removes "map" icon from upper left
                    //mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN]
                }, // here´s the array of controls
                //disableDefaultUI: true, // a way to quickly hide all controls
                scaleControl: true,
                zoomControl: true,
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.LARGE
                    //style: google.maps.ZoomControlStyle.SMALL
                },
                //fullscreenControl: true,
                UiSettings: {
                    setMyLocationEnabled: true,
                    setMyLocationButtonEnabled: true
                }
            });

            //Campus Marker Initialized
            marker = new google.maps.Marker({
                position: {lat: campusLat, lng: campusLng},
                title: campusName
            });
            destlat = marker.position.lat();
            destlong = marker.position.lng();

            dropMarker(campusName, campusLat, campusLng, "c"); //green for campus
            setMarkerInfo(marker);
        }

        /*end init map*/

        var markersArray = [];
        var prev_infowindow = null;

        function dropMarker(name, latitude, longitude, icon) {
            if (icon == "c") {
                //pushpin for campus marker
                iconColor = 'http://maps.google.com/mapfiles/ms/icons/grn-pushpin.png';
            } else if (icon == "p") {
                //color for personal marker location
                iconColor = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
            } else {
                //default marker building color
                iconColor = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
            }

            var marker;
            var selectedAnimation;

            if (icon == "p" || icon == "c") {
                selectedAnimation = "DROP";
            }

            marker = new google.maps.Marker({
                position: {lat: latitude, lng: longitude},
                animation: google.maps.Animation[selectedAnimation],
                map: map,
                title: name,
                icon: iconColor
            });

            markersArray.push(marker);

            marker.addListener('click', function () {
                setMarkerInfo(marker);
                destlat = marker.position.lat();
                destlong = marker.position.lng();
            });
        }

        function setMarkerInfo(marker) {
            if (prev_infowindow) {
                prev_infowindow.close();
            }

            var pos = marker.getPosition();
            map.setCenter(pos);

            var infoWindow = new google.maps.InfoWindow({
                map: map,
                pixelOffset: new google.maps.Size(0, -15),
                content: marker.title
            });

            infoWindow.setPosition(pos);
            //infoWindow.setContent(marker.title);
            map.setCenter(pos);

            prev_infowindow = infoWindow;
        }

        function removeMarkers(name) {
            for (i = 0; i < markersArray.length; i++) {
                if (markersArray[i].title == name) {
                    markersArray[i].setMap(null);
                }
            }
        }

        $scope.myLocation = function locateClick() {
            myLocation();
        };

        prev_youInfo = null;
        var prev_loc_marker = false;

        var startlat;
        var startlong;
        var destlat;
        var destlong;

        var watchID = null;

        function myLocation() {
            if (prev_youInfo) {
                prev_youInfo.close();
            }

            if (prev_loc_marker) {
                prev_loc_marker.setMap(null);
            }
            removeMarkers("You");

            //Check to see if geolocation / location services is turned on
            //cordova.plugins.diagnostic works on hardware, does not work on emulator
            if (window.cordova) {

                cordova.plugins.diagnostic.isLocationEnabled(function (enabled) {
                    //alert("Location is " + (enabled ? "enabled" : "disabled")); //debug

                    //TODO: test this in iOS - working in Android
                    //if disabled, dialog ask to enable and this will goto menu
                    if (!enabled) {
                        if (window.cordova) {
                            var confirmPopup = $ionicPopup.confirm({
                                title: 'Location Services',
                                template: 'Location services disabled, would you like to turn this on?'
                            });
                            confirmPopup.then(function (res) {
                                if (res) {

                                    //TESTING
                                    //console.log('OK');

                                    cordova.plugins.diagnostic.switchToLocationSettings();
                                } else {

                                    //TESTING
                                    //console.log('Cancel');
                                }
                            });
                        }
                    }
                }, function (error) {
                    //TODO: add error handling here
                    //alert("The following error occurred: " + error);
                });
            }

            if (navigator.geolocation) {
                getPosition();
                /*navigator.geolocation.getCurrentPosition(function (position) {
                 var pos = {
                 lat: position.coords.latitude,
                 lng: position.coords.longitude
                 };

                 //TODO: [OPTIONAL] use InfoBox instead of InfoWindow, CSS customizable
                 var infoWindow = new google.maps.InfoWindow({
                 map: map,
                 pixelOffset: new google.maps.Size(0, -15),
                 content: "You are here"
                 });
                 prev_youInfo = infoWindow;

                 infoWindow.setPosition(pos);
                 map.setCenter(pos);

                 dropMarker("You", pos.lat, pos.lng, 'p');
                 startlat = pos.lat;
                 startlong = pos.lng;
                 });*/
            } else {
                handleLocationError(false, infoWindow, map.getCenter());
            }
        }  //end myLocation()

        function getPosition() {
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                //TODO: [OPTIONAL] use InfoBox instead of InfoWindow, CSS customizable
                var infoWindow = new google.maps.InfoWindow({
                    map: map,
                    pixelOffset: new google.maps.Size(0, -15),
                    content: "You are here"
                });
                prev_youInfo = infoWindow;

                dropMarker("You", pos.lat, pos.lng, 'p');

                infoWindow.setPosition(pos);
                map.setCenter(pos);

                startlat = pos.lat;
                startlong = pos.lng;
            });
        }

        function handleLocationError(browserHasGeolocation, infoWindow, pos) {
            infoWindow.setPosition(pos);
            infoWindow.setContent(browserHasGeolocation ?
                'Error: The Geolocation service failed.' :
                'Error: geolocation turned off or unsupported.');
        }

        /*    $scope.myDirection = function directionClick() {
         if (directionsDisplay) {
         directionsDisplay.setDirections({routes: []});  //clear route and set for redraw
         }
         directionsDisplay = new google.maps.DirectionsRenderer();
         directionsDisplay.setMap(map);
         myDirection();
         };*/

        function myDirection(selectedMode) {
            var start = {lat: startlat, lng: startlong};
            var end = {lat: destlat, lng: destlong};
            //alert(end.lat); //debug

            //TODO: walking or driving - how to switch between the two?  DROPDOWN MENU or symbols

            //selectedMode = "WALKING";
            //selectedMode = "DRIVING";

            var request = {
                origin: start,
                destination: end,
                travelMode: google.maps.TravelMode[selectedMode]
            };

            directionsService.route(request, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                }
            });
        }  //end myDirection

        $scope.bldgListClick = function bldgListClick(itemObj) {
            $scope.closeNav();
            setMarkerByName(itemObj);

            //TESTING
            //console.log("itemsList[] Length = " + $scope.itemsList.length);
        };

        function setMarkerByName(itemObj) {
            for (var i = 0; i < markersArray.length; i++) {
                if (markersArray[i].getTitle() == (itemObj.name)) {
                    setMarkerInfo(markersArray[i]);
                    //$ionicScrollDelegate.scrollTop(); //don't need if scrolling list or sidemenu

                    destlat = markersArray[i].position.lat();
                    destlong = markersArray[i].position.lng();

                    var pos = markersArray[i].getPosition();
                    map.setCenter(pos);
                }
            }
        }

        /////////////////////////////////////////////
        // ref
        // https://github.com/aaronksaunders/hu1/wiki/2.1-Using-ng-repeat-in-Ionic-ListView
        // initialize building array
        $scope.itemsList = [];

        //this gets called twice if not assigned variable
        $scope.bldg = MapService.getBuildings().then(          //ALL buildings
            //$scope.bldg = MapService.getBuildings("PRAY-H").then(  //single building
            function (result) {
                $scope.buildings = result.data.buildings; //get list of buildings from JSON
                //iterate list of buildings
                angular.forEach($scope.buildings, function (item) {
                    $scope.itemsList.push({"name": item.name});
                    dropMarker(item.name, item.latitude, item.longitude);
                    //console.log(item.name, item.latitude, item.longitude); //debug
                });

                //this gives all building info (name, lat, long, img)
                //console.log(JSON.stringify($scope.buildings, " , ", "    ")); //debug

                //console.log($scope.buildings[0].name); //this gives the ID name
                //$scope.itemsList.push({"name": $scope.buildings[0].name}); //debug
            },
            function (error) {
                //TODO: error handling when JSON unavailable or server unreacheable

                //TESTING
                //console.log("error MapCtrl bldg" + error);
            });

        //TODO: simple map constructor - make this callback on load
        initMap();
    })
    //end MapCTRL

    // return important numbers
    .controller('CampusNumbersCtrl', function ($scope, NumbersServices) {
        $scope.triggerCall = function (number) {
            document.location.href = 'tel:' + number
        };

        var initNumbers = function () {
            NumbersServices.numbers().then(
                function (response) {
                    $scope.numberList = response.data.numbers;
                },
                function (error) {

                    //TESTING
                    //console.log("Error in initNumbers "+error);
                }
            )
        };
        initNumbers();
    })

    // manage preferences, including checking for updates
    // http://docs.ionic.io/v1.0/docs/deploy-install
    .controller('PreferencesCtrl', function ($scope, $ionicModal) {
        // Update app code with new release from Ionic Deploy
        $scope.doUpdate = function () {
        };
        // Check Ionic Deploy for new code
        $scope.checkForUpdates = function () {
        }
    })

    .controller('SectionDetailCtrl', function ($scope, $state, $ionicPopover, UtilityService, RegistrationService, UtilityService) {
        $scope.search = {
            searchText: "",
            selectedTerm: "",
            searchResults: [],
        };

        $scope.search.selectedTerm = RegistrationService.getActiveTerm();

        //TESTING
        //console.log($scope.search.selectedTerm); //TESTING

        $scope.currentSection = {};

        $scope.addToCart = function (course) {
            UtilityService.showLoading('Adding...');
            RegistrationService.modifyCart(course, "add").then(
                function (response) {
                    var rsp = response;
                    UtilityService.showSuccess('Section ' + course.sectionId + ' added to your cart');
                    $state.go('reg.search_results');
                    //RegistrationService.addToLocalCart(course);
                },
                function (error) {

                    //TESTING
                    //console.log("Error in addToCart " + error);
                }
            ).finally(function () {
                UtilityService.hideLoading();
            })
        };

        $scope.closeDetail = function () {
            $state.go('reg.search_results');
        };

        //$scope.$on('$ionicView.enter', function () {
        $scope.$on("$ionicView.enter", function (event, data) {

            //TESTING
            //console.log("//////STATE PARAMS SectionDetail: ", data.stateParams);
            //console.log(data);
            //console.log(data.stateName);
            //console.log("EVENT");
            //console.log(event);
            //direction swap

            $scope.currentSection = RegistrationService.getDetailCourse();

            //TESTING
            //console.log("current section - location is Campus Code");
            //console.log($scope.currentSection);
            //$scope.currentSection = setCampusCode($scope.currentSection);
        });
        $scope.$on('$ionicView.leave', function () {
            UtilityService.hideLoading();
        });
    })

    .controller('RegCheckoutCtrl', function ($scope, $state, $ionicModal, $ionicListDelegate, UtilityService, RegistrationService, $ionicPopover) {
        $scope.planCourses = [];
        $scope.status = [];
        $scope.term = RegistrationService.getActiveTerm();

        ////////////////// RegCheckoutCtrl Modals /////////////////
        // Modal 1 - Registration Status
        $ionicModal.fromTemplateUrl('templates/modals/regCheckoutStatus.html', {
            id: '1', // We need to use and ID to identify the modal that is firing the event!
            scope: $scope,
            backdropClickToClose: false,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.oModal1 = modal;
        });

        // Modal 2 - Alt Pin
        $ionicModal.fromTemplateUrl('templates/modals/alternate_pin.html', {
            id: '2', // We need to use and ID to identify the modal that is firing the event!
            scope: $scope,
            backdropClickToClose: false,
            animation: 'slide-in-up'
        }).then(function (modal) {
            //$scope.modal = $ionicModal;
            $scope.oModal2 = modal;
        });

        $scope.openModal = function (index, response) {
            if (index == 1) {
                $scope.status = response.data;
                $scope.oModal1.show();
            }
            else {
                $scope.status = response.data;
                $scope.altpin = {};
                $scope.currentPin = RegistrationService.getAltPin();
                $scope.oModal2.show();
            }
        };

        $scope.closeModal = function (index) {
            if (index == 1) {
                $scope.oModal1.hide();
                $state.go('reg.cart');

            }
            else $scope.oModal2.hide();
        };

        $scope.cancelAltPin = function () {
            //console.log('AlptPin Cancel');
            /*$scope.modal.hide();*/
            $scope.closeModal(2);
        };

        $scope.submitAltPin = function () {
            //console.log('AltPin Submit'); //TESTING
            //console.log($scope.altpin.value); //TESTING
            RegistrationService.setAltPin($scope.altpin.value);
            //put pin here
            var x = RegistrationService.getAltPin();
            //console.log(x); //TESTING
            //console.log('new pin = '+RegistrationService.getAltPin() ); //TESTING
            if (angular.isUndefined(x)) {
                UtilityService.showSuccess('Pin cannot be blank.  Please enter again.');
            } else {
                $scope.closeModal(2);
                UtilityService.showSuccess('Pin ' + x + ' entered.  Please Register to continue.');
            }
        };
        ////////////////// End RegCheckoutCtrl Modals ////////////////

        var addCartToRegData = function () {
            var requestData = {
                sectionRegistrations: []
            };

            for (var i = 0; i < $scope.planCourses.length; i++) {
                var course = $scope.planCourses[i];
                var section = {};

                //TESTING - this is where altpin should be added to register correctly
                //RegistrationService.setAltPin('111111')
                //if not undef getAltPin then section.altpin;

                var x = RegistrationService.getAltPin();

                //TESTING
                //console.log("alt pin = ");
                //console.log(x);

                if (angular.isDefined(x)) {
                    section.altPin = x;
                }

                //TESTING
                //console.log("altpin addCartToRegData");
                //console.log(x);
                //section.altPin = RegistrationService.getAltPin();
                //section.altPin = '222222';

                section.termId = course.termId;
                section.sectionId = course.sectionId;
                section.credits = course.credits;
                section.action = course.action != null ? course.action : "Add";
                requestData.sectionRegistrations.push(section);
            }
            return requestData;
        };

        ///remove registered classes from array
        $scope.removeRegisteredClasses = function (data) {

            //console.log("count");
            //console.log(data.length);
            for (var i = data.length - 1; i > -1; i--) {
                //console.log("i = "+i);
                //console.log(data[i].classification);
                if (data[i].classification == "registered") {
                    //console.log("removing");
                    //console.log(data[i].classification);
                    data.splice(i, 1);
                }
            }
        };

        $scope.checkoutTotalHours = function () {
            var total = 0;
            for (var i = 0; i < $scope.planCourses.length; i++) {
                var creditRunningTotal = $scope.planCourses[i].credits;
                total += creditRunningTotal;
            }
            return total;
        };

        var getCart = function (term) {
            if (term != undefined) {
                UtilityService.showLoading('Loading cart ...');
                RegistrationService.plans(term.id).then(
                    function (response) {
                        var plans = response.data.plans;

                        //orig
                        //$scope.planCourses = plans[0].terms[0] == undefined ? [] : plans[0].terms[0].plannedCourses;
                        //$scope.removeRegisteredClasses($scope.planCourses);
                        //testing
                        var x = plans[0].terms[0] == undefined ? [] : plans[0].terms[0].plannedCourses;

                        //TESTING
                        //console.log("checkout last step");
                        //console.log($scope.planCourses);


                        RegistrationService.getSectionDetail(x).then(
                            function (results) {

                                //TESTING
                                //console.log("getSectionDetail results");
                                //console.log(results);

                                //TESTING
                                //$scope.planCourses = x;
                                //$scope.planCourses = results;

                                $scope.planCourses = plans[0].terms[0] == undefined ? [] : plans[0].terms[0].plannedCourses;
                                $scope.removeRegisteredClasses($scope.planCourses);

                                //TESTING
                                //console.log($scope.planCourses);
                                //console.log($scope.planCourses.length);
                                //$scope.Hours = $scope.Hours + course.credits;
                                //console.log("HOURS");
                                //console.log($scope.Hours);

                                UtilityService.hideLoading();
                            });
                    },
                    function (error) {
                        //TESTING
                        //console.log("Error in getCart " + error);

                        UtilityService.showError("Error with Cart: " + error + " Please try again.");
                    }
                ).finally(function () {
                    UtilityService.hideLoading();
                })
            }
        };

        $scope.goBack = function () {
            $state.go('reg.cart');
        };

        $scope.setRegType = function (course, action) {
            var idx = planCourses.indexOf(course);
            if (idx >= 0) {
                course.action = action;
                planCourses[idx] = course;
            }
            $ionicListDelegate.closeOptionButtons();
        };

        var regResponse;
        $scope.checkRegister = function () {

            UtilityService.clearMsgs();

            //TESTING
            //console.log("checkRegister");
            //console.log("Registering...");

            UtilityService.showLoading('Registering...');
            var regData = addCartToRegData();

            RegistrationService.registerCourses(regData).then(
                function (response) {

                    //TESTING
                    //console.log("Registration BEGIN");

                    regResponse = response;

                    //TESTING
                    //console.log("checkRegister = ");
                    //console.log(response); //TESTING

                    //if message "Your PIN is invalid." then show alt pin
                    //and will need to registerCourses again
                    //with the alt pin entered
                    //show pin somewhere so people can change it if need be
                    //do this instead fo showing modal

                    var x = RegistrationService.getAltPin();

                    //TESTING
                    //console.log("altPin x = "+x);
                    //console.log(regResponse.data);
                    //console.log(angular.isUndefined(x));
                    //console.log(regResponse.data.messages[0]);
                    //console.log(regResponse.data.messages[0] == null);
                    //console.log(regResponse.data.messages[0].message);//error cannot display if  null

                    var canRegister = "yes";
                    var err_msg = '';
                    var failure_msg = '';
                    var showAltPin = 'no';

                    //Check for Failure(s)
                    //TESTING
                    //console.log("Checking holds and restrictions...");

                    if (angular.isDefined(regResponse.data.failures[0])) {

                        //TESTING
                        //console.log("REGISTRATION FAILURE");
                        //console.log(regResponse.data);
                        //make this so it does NOT check for ALT PIN
                        //ONLY NON-APPOINTMENT FAILURES FIRST
                        //MAKE THIS INTO A SEPARATE FUNCTION IF NEEDED
                        //LAST THING TO CHECK IS ALT-PIN BEFORE REGISTRATION
                        //USE canRegister VARIABLE

                        //if its your pin is invalid then do alt-pin again

                        if (angular.isDefined(regResponse.data.messages[0])) {
                            //THIS SHOULD CATCH BOTH HOLDS AND ALT PIN
                            //Failure and message defined, capture multiple messages here
                            //TESTING
                            //console.log("1. regResponse.data.messages");
                            //console.log(regResponse.data.messages[0]);

                            //console.log("ALT PIN FAILURE show modal message = " + regResponse.data.messages[0].message);
                            canRegister = "cannot register, failure messages exist";
                            err_msg = regResponse.data.messages[0].message + " Please contact the Registrar.";

                            var msgCount = regResponse.data.messages.length;

                            //TESTING
                            //console.log("msgCount = " + msgCount);

                            //Check for multiple messages
                            for (var i = 0; i < msgCount; i++) {
                                if (regResponse.data.messages[i].message == "Your PIN is invalid.") {
                                    showAltPin = "yes";  //appointment time or alt pin on account
                                    canRegister = "yes"; //no holds
                                }
                            }

                            //TESTING
                            //console.log("showAltPin = "+showAltPin);
                        }

                        //check for other restrictions if alt-pin satisfied
                        if (showAltPin != "yes") {
                            //no alt pin at this point
                            //no holds
                            //check for course restrictions

                            //TESTING
                            //console.log("alt pin ok, no holds - checking other restrictions");

                            if (angular.isDefined(regResponse.data.failures[0].messages)) {
                                //TESTING
                                //console.log("other failures");

                                canRegister = "cannot register, failure messages exist";
                                var totalFailures = regResponse.data.failures.length;

                                //TESTING
                                //console.log('totalFailures = '+totalFailures);

                                for (var ii = 0; ii < totalFailures; ii++) {

                                    var total = regResponse.data.failures[ii].messages.length;

                                    //TESTING
                                    //console.log("total = "+total);

                                    //Error Messages
                                    for (var i = 0; i < total; i++) {
                                        //TESTING
                                        //console.log(regResponse.data.failures[ii]);
                                        //console.log(regResponse.data.failures[ii].messages); //ok
                                        //console.log(regResponse.data.failures[ii].messages[i]);
                                        //console.log(regResponse.data.failures[ii].messages[i].message);
                                        failure_msg = failure_msg + ' ' + regResponse.data.failures[ii].courseName + ' ' + regResponse.data.failures[ii].messages[i].message;
                                    }

                                    //coursename
                                    err_msg = err_msg + '<br>' + failure_msg;
                                }

                                //TESTING
                                //console.log(err_msg);
                                //console.log(angular.isDefined(regResponse.data.failures[0].messages) );
                            }
                        }

                        if (canRegister != "yes") //show if general errors
                        {
                            UtilityService.showError("Unable to Register due to the following error(s):" + '<br>' + err_msg);
                        }
                        else {
                            //alt pin necessary here
                            var x = RegistrationService.getAltPin();

                            //TESTING
                            //console.log("OPEN MODAL");
                            //console.log(regResponse);
                            //console.log(x);
                            //error here

                            if (angular.isUndefined(x)) {
                                //UtilityService.showSuccess(regResponse.data.messages[0].message);

                                //TESTING
                                //console.log("alt pin undef and needed");

                                //UtilityService.showSuccess(regResponse.data.messages[0].message);
                                //console.log("altpin needed or incorrect, SHOW ALTPIN MODAL"); //TESTING
                                $scope.openModal(2, regResponse);
                                $scope.closeModal;
                            }
                            else {

                                //TESTING
                                //console.log("alt pin DEFINED and INCORRECT");

                                UtilityService.showSuccess("Alternate Pin incorrect, Please enter valid pin.");
                                $scope.openModal(2, regResponse);
                                $scope.closeModal;
                            }
                        }
                    }

                    //TESTING
                    /*                console.log('checkregister openModal');
                     console.log('isdef');
                     console.log(angular.isDefined(RegistrationService.getAltPin()));
                     console.log('msg');
                     console.log(regResponse.data.messages[0] != null);*/
                    /*else
                     {
                     if (regResponse.data.messages[0])

                     }*/
                    else {
                        //No Failure Message - can use this to display when sucesses AND failures

                        //TESTING
                        //console.log("No Failure. No Restritctions & Altpin is CORRECT or not needed, process normally or additional processing"); //TESTING

                        $scope.openModal(1, regResponse); //Registration working with pin added in
                        $scope.closeModal;
                    }
                },
                function (error) {

                    //TESTING
                    //console.log('Error in RegistrationService.registerCourses ' + error);
                }
            ).finally(function () {
                UtilityService.hideLoading();

                //TESTING process response here;
                //console.log("FINAL altpin check");
                //console.log("reg response");
                //console.log(regResponse);
                //console.log("reg resp 1 = ");
                //console.log(angular.isUndefined(regResponse.data.messages[0]));
                //console.log("reg resp 2 = "); //undef
                //console.log(regResponse.data.messages[0]);

//NEED TO TEST THIS WITH ALT_PIN SET, WITH IT ENTERED INCORRECTLY AND WITHOUT IT SET
                //if (angular.isUndefined(regResponse.data.messages[0]) || regResponse.data.messages[0] == null)

                //TESTING - above
                /*                var x = RegistrationService.getAltPin();
                 console.log("altPin x = "+x);
                 console.log(regResponse.data);
                 console.log(angular.isUndefined(x));
                 console.log(regResponse.data.messages[0]);
                 console.log(regResponse.data.messages[0] == null);
                 console.log(regResponse.data.messages[0].message);


                 console.log('checkregister openModal');
                 if (angular.isDefined(RegistrationService.getAltPin()) || regResponse.data.messages[0] != null)
                 {
                 UtilityService.showSuccess(regResponse.data.messages[0].message);
                 console.log("altpin needed or incorrect, SHOW ALTPIN MODAL"); //TESTING
                 $scope.openModal(2, regResponse);
                 }
                 else
                 {
                 console.log("altpin undef and no message");
                 console.log("altpin is CORRECT or not needed, process normally or additional processing"); //TESTING
                 $scope.openModal(1, regResponse); //Registration working with pin added in
                 }*/

                //ORIG
                /*if (angular.isUndefined(RegistrationService.getAltPin()) && regResponse.data.messages[0] == null)
                 {
                 console.log("altpin undef and no message");
                 console.log("altpin is CORRECT or not needed, process normally or additional processing"); //TESTING
                 $scope.openModal(1, regResponse); //Registration working with pin added in
                 }
                 else {
                 UtilityService.showSuccess(regResponse.data.messages[0].message);
                 console.log("altpin needed or incorrect, SHOW ALTPIN MODAL"); //TESTING
                 $scope.openModal(2, regResponse);
                 }*/
                //ORIG
                //showStatusModal(response); //THIS IS NOW $scope.openModal(1, regResponse)
                //$scope.openModal(1, regResponse);
                //console.log("regResponse"); //TESTING
                //console.log(regResponse); //TESTING
                //console.log("END"); //TESTING
            });
        };

        // get cart references, add to json object and send to registrationservice.addDrop()
        $scope.doAddDrop = function (crn, action) {
            var payload = {};
            payload.bannerId = "";
            payload.term =

                {
                    "bannerId": "HOSWEB006",
                    "term": "201410",
                    "keySequenceNumber": "01",
                    "altPin": "XXXX",
                    "conditionalAddDrop": "Y",
                    "courseReferenceNumbers": [
                        {"courseReferenceNumber": "20201"},
                        {"courseReferenceNumber": "20001"},
                        {"courseReferenceNumber": "20441"}
                    ],
                    "actionsAndOptions": [
                        {
                            "courseReferenceNumber": "20202",
                            "selectedAction": "RW",
                            "selectedLevel": "UG",
                            "selectedGradingMode": "D",
                            "selectedStudyPath": "3",
                            "selectedCreditHour": "3.3"
                        },
                        {
                            "courseReferenceNumber": "20211",
                            "selectedAction": "DW"
                        }
                    ]
                }
        };

        $scope.$on('$ionicView.enter', function () {
            getCart(RegistrationService.getActiveTerm());
        });

        $scope.$on('$ionicView.leave', function () {
            UtilityService.hideLoading();
        })
    })

    .controller('RegistrationCartCtrl', function ($scope, $state, $ionicPopup, UtilityService, RegistrationService) {
        $scope.cartCount = 0;
        $scope.model = {};
        $scope.currentPlan = [];
        $scope.courseSections = [];
        $scope.courseArray = [];

        var getCart = function (term) {

            UtilityService.showLoading("Loading Cart...");

            if (term != undefined) {
                RegistrationService.plans(term.id).then(
                    function (response) {
                        var plans = response.data.plans;
                        $scope.cart_terms = plans[0].terms;

                        //TESTING
                        //console.log("cartCTRL cart_terms");
                        //console.log($scope.cart_terms);

                        $scope.cart = $scope.cart_terms.length == 0 ? 'n' : plans[0].terms[0];

                        //TESTING
                        /*console.log("length = "+$scope.cartCount);
                         $scope.courseArray = plans[0].terms[0];
                         console.log("cart");
                         console.log(plans[0].terms[0].plannedCourses);*/

                        //only do this if something in cart

                        var getDetails = 'n';
                        //console.log("test");
                        //console.log(_.size(plans[0].terms[0].plannedCourses) );

                        var cartsize = 0;

                        //TESTING
                        //console.log("isdef");
                        //console.log($scope.cart);
                        //console.log($scope.cart[0] == "n");

                        if ($scope.cart[0] != "n") {
                            cartsize = _.size(plans[0].terms[0].plannedCourses);

                            //console.log("cartsize");
                            //console.log(cartsize);

                            if (cartsize > 0) {
                                for (var i = 0; i < cartsize; i++) {

                                    if (plans[0].terms[0].plannedCourses[i].classification == 'planned') {

                                        //TESTING
                                        //This is the Unregistered or "planned" courses in the Cart
                                        //console.log(plans[0].terms[0].plannedCourses[i]);
                                        getDetails = 'y';
                                    }
                                    if (plans[0].terms[0].plannedCourses[i].classification == 'registered') {

                                        //TESTING
                                        //This is the Registered  courses in the Class Roster
                                        //console.log(plans[0].terms[0].plannedCourses[i]);
                                        getDetails = 'y';
                                    }

                                }
                            }
                        }

                        //TESTING
                        //console.log("getDetails");
                        //console.log(getDetails);

                        if (getDetails == 'y') {
                            RegistrationService.getSectionDetail(plans[0].terms[0].plannedCourses, "CART").then(
                                function (results) {

                                    //TESTING
                                    //console.log("get cart section detail");
                                    //console.log(results);

                                    var x = RegistrationService.cartResults();

                                    //TESTING
                                    //console.log(x);
                                    //console.log(plans[0].terms[0].plannedCourses);

                                    $scope.courseArray = plans[0].terms[0];

                                    //TESTING
                                    //console.log("course array");
                                    //console.log($scope.courseArray);

                                    $scope.cartCount = ($scope.cart.length == 0) ? 0 : plans[0].terms[0].plannedCourses.length;
                                    $scope.cart_terms = plans[0].terms;
                                    UtilityService.hideLoading();
                                });

                            //TESTING
                            //console.log('courseArray');
                            //console.log($scope.courseArray);
                        } else {
                            //No Details needed
                            UtilityService.hideLoading();
                        }
                    },
                    function (error) {

                        //TESTING
                        //console.log("Error in getCart + " + error);

                    }
                )
                    .finally(function () {
                        //UtilityService.hideLoading();
                    })
            }
        };

        //may need to turn this into variable to get rid of error
        /// Total Credits Hours //////////////
        $scope.getTotalCreditHours = function () {
            var creditRunningTotal = 0;
            var total = 0;
            for (var i = 0; i < $scope.cartCount; i++) {
                creditRunningTotal = $scope.courseArray.plannedCourses[i].credits;
                total += creditRunningTotal;
            }
            return total;
        };
        ///////////////////////////////

        var displayFinancialResponsibility = function () {
            // A confirm dialog
            var confirmPopup = $ionicPopup.confirm({
                title: 'Financial Responsibility Agreement',
                templateUrl: 'templates/partials/registration-finresp.html',
                /*templateUrl: 'templates/partials/home.html',*/
                cancelText: 'Reject',
                okText: 'Accept'
            });

            confirmPopup.then(function (res) {
                if (res) {

                    //TESTING
                    //console.log("Financial Responsibility Accept");
                    //console.log(res);
                    //console.log(cart_terms); //not defined

                    var term = RegistrationService.getActiveTerm();

                    //TESTING
                    //console.log('active term');
                    //console.log(term.id);

                    var x = RegistrationService.acceptFinancialResponsibility(term);

                    //TESTING
                    //console.log('Return from accept');
                    //console.log(x);

                    $state.go('reg.reg_checkout');

                    //TESTING
                    //console.log('You are sure');

                    UtilityService.showSuccess("Financial Responsibility accepted, Please click Register to continue...");
                } else {

                    //TESTING
                    //console.log('You are not sure');

                    UtilityService.showError("You have rejected financial responsibility agreement");
                }
            });
        };

        $scope.goBack = function () {
            $state.go('reg.search');
        };

        $scope.acceptResponsibilty = function () {
            RegistrationService.acceptFinancialResponsibility(student, term).then(
                function (response) {
                    UtilityService.showSuccess("Financial responsibility accepted for selected term")
                },
                function (reject) {
                    UtilityService.showError("Error recording acceptance of financial responsibility")
                }
            );
            $scope.modal.hide();
        };

        $scope.rejectResponsibilty = function () {
            UtilityService.showError("You have rejected financial responsibility agreement");
            $scope.modal.hide();
        };

        // if they haven't agreed to financial responsibility, don't show the checkout screen
        $scope.checkout = function () {
            RegistrationService.hasFinancialResponsibility(RegistrationService.getActiveTerm()).then(
                function (response) {

                    //TESTING
                    //console.log("checkout hasFinancialResponsibility");

                    var x = RegistrationService.getActiveTerm();

                    //TESTING
                    //console.log("term = ");
                    //console.log(x);
                    //console.log(response);

                    if (response.data.HASFINRESP == 1) {
                        $state.go("reg.reg_checkout")
                    } else {
                        displayFinancialResponsibility()
                    }
                }, function (error) {

                    //TESTING
                    //console.log("Error in $scope.checkout " + error);
                }
            )
        };

        $scope.removeFromCart = function (course) {
            RegistrationService.modifyCart(course, "remove").then(
                function (response) {
                    getCart(RegistrationService.getActiveTerm());
                },
                function (error) {

                    //TESTING
                    //console.log("Error in removeFromCart " + error);
                }
            )
        };

        $scope.$on("$ionicView.enter", function (event, data) {

            $scope.cartCount = 0; //reset scope cartCount when changing state

            //TESTING
            //console.log("//////STATE PARAMS RegistrationCartCtrl: ", data.stateParams);
            //console.log(data);
            //console.log(data.stateName);
            //console.log("EVENT");
            //console.log(event);

            UtilityService.hideLoading();
            getCart(RegistrationService.getActiveTerm());
        });
        $scope.$on('$ionicView.leave', function () {
            UtilityService.hideLoading();
        })
    })//END RegistrationCartCtrl

    .controller('RegistrationSearchResultCtrl', function ($scope, $state, UtilityService, $rootScope, $ionicModal, RegistrationService, AuthenticationService) {

        $scope.go = function (path) {
            //$state.go('reg.search');
            $state.go(path);

        };

        $scope.search = {
            searchText: "",
            selectedTerm: "",
            searchResults: [],
            recentSearches: []
        };

        $scope.search.selectedTerm = RegistrationService.getActiveTerm();

        //TESTING
        //console.log("Registration Search Results - Active Term");
        //console.log($scope.search.selectedTerm);

        // condense list of courses and sections for display
        var getCourseSections = function (terms) {
            var courseSections = {};

            //TESTING
            //console.log("getCourseSections terms");
            //console.log(terms);
            //console.log("end getCourseSections");

            for (var i = 0; i < terms.length; i++) {
                if (courseSections.hasOwnProperty(terms[i].courseName) == false) {
                    courseSections[terms[i].courseName] = [];
                }
                courseSections[terms[i].courseName].push(terms[i]);
            }
            return courseSections;
        };

        $scope.goBackToSearch = function () {
            $state.go('reg.search');
        };

        $scope.showSectionDetail = function (course) {

            //TESTING
            //console.log("showSectionDetail");
            //console.log(course);

            RegistrationService.setDetailCourse(course);
            $state.go('reg.section_detail');
        };

        // get registration terms on search entry, .
        $scope.$on("$ionicView.enter", function (event, data) {

            //TESTING
            //console.log("//////STATE PARAMS RegistrationSearchResultCtrl: ", data.stateParams);
            //console.log(data);
            //console.log(data.stateName);
            //console.log("EVENT");
            //console.log(event);

            //do this on initial enter - switch when coming back from cart if already searched
            $scope.sections = RegistrationService.searchResults();

            //TESTING
            //console.log("SECTIONS");
            //console.log($scope.sections);

            RegistrationService.setDetailCourse(null);
            $scope.courseSections = getCourseSections(RegistrationService.searchResults());

            //TESTING
            //console.log("Registration Search Results onEnter");

            UtilityService.hideLoading();
        });

        $scope.$on('$ionicView.leave', function () {
            UtilityService.hideLoading();
        })
    })

    .controller('RegistrationCtrl', function ($q, $scope, $state, UtilityService, $rootScope, $ionicModal, RegistrationService, AuthenticationService, $ionicPopover) {
        /* implemented end points - https://xedocs.ellucian.com/mobile-server-api/registrationtabs.html
         registration terms - GET /mobileserver/api/2.0/registration/{studentId}/terms HTTP/1.0
         views from https://www.mchs.edu/pdf/Course_Registration_Using_Ellucian_GO.pdf
         */
        $scope.search = {
            searchText: "",
            selectedTerm: "",
            searchResults: [],
            scheduleType: "",
            recentSearches: [],
            sectionDetails: []

            //TESTING - USE FOR TESTING RECENT SEARCHES IN REGISTRATION CLASS SEARCH
            //recentSearches: ['avt', 'ece', 'bmmt', 'attr', 'elec', 'anth', 'bio', 'dtc', 'essc']
        };
        $scope.cartCount = 0;
        $scope.courseSections = {};

        var getStudentTerms = function () {
            RegistrationService.terms().then(
                function (response) {

                    var canRegister = 'Y'; //Default for 1 or more open terms
                    var checkTerms = 0;

                    if (angular.isDefined(response.data.terms.length)) {
                        checkTerms = response.data.terms.length; //term array length, change for testing
                    }

                    //TESTING
                    //console.log("Registration Search - getStudentTerms");
                    //console.log(response);

                    //set selected term here and on update
                    if (checkTerms > 1) {
                        //TESTING
                        //console.log("More Than One Term");
                        //console.log(response.data.terms[0].name);

                        UtilityService.showSuccess("Multiple Open Terms Available" + '<br>' + "Please Select Term For Registration before searching courses.")
                    }
                    else {
                        if (checkTerms < 1) {
                            canRegister = 'N';
                            UtilityService.showError("No Terms Available For Registration" + '<br>' + "Please check Academic Calendar or Internet Connection and try again.")
                        }
                        else {
                            //TESTING
                            //console.log("One Term default");
                        }
                    }

                    if (canRegister == 'Y') {
                        $scope.terms = response.data.terms;
                        $scope.search.selectedTerm = $scope.terms[0];
                        RegistrationService.setActiveTerm($scope.search.selectedTerm);
                    }
                },
                function (error) {

                    //TESTING
                    //console.log('Error in getStudentTerms ' + error);

                    UtilityService.showError("Unable to get Student Terms" + "<br>" + error);
                }
            )
        };

        /////////// popover for selected term ///////////
        // .fromTemplateUrl() method
        $ionicPopover.fromTemplateUrl('templates/reg_term.html', {
            scope: $scope
        }).then(function (popover) {
            $scope.popover = popover;
            //popover.show(".ion-arrow-move");
        });

        $scope.openPopover = function ($event) {
            //click event instantiates popover from button

            //TESTING
            //console.log("popover for selected term - uses templates/reg_term.html  ");

            $scope.popover.show($event);
        };

        //close on change
        $scope.closePopover = function () {
            $scope.popover.hide();
        };

        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function () {
            $scope.popover.remove();
        });

        // Execute action on hide popover
        $scope.$on('popover.hidden', function () {
            // Execute action
            //this is for close - when clicked off of modal
            //console.log('close'); //TESTING
            $scope.popover.destroy;
        });

        // Execute action on remove popover
        $scope.$on('popover.removed', function () {
            // Execute action
        });
        /////////// End popover for selected term ///////////

        $scope.updateSelectedTerm = function (term) {

            //TESTING
            //console.log("updateSelectedTerm");
            //console.log($scope.search.selectedTerm);

            RegistrationService.setActiveTerm($scope.search.selectedTerm);
            $scope.closePopover();
        };

        // https://xedocs.ellucian.com/mobile-server-api/registration.html#registration-eligibility
        var getElegibility = function () {
            RegistrationService.eligibility().then(
                function (response) {

                    //TESTING
                    //console.log('elegibility');
                    //console.log(response);

                    $scope.isEligible = response.data.eligible;

                    //TESTING
                    //console.log('eligible = '+$scope.isEligible);
                },
                function (error) {

                    //TESTING
                    //console.log('Error in getElegibility ' + error);
                }
            )
        };

        var getAcademicLevels = function () {
            Registration.academicLevels().then(
                function (response) {
                    $scope.academicLevels = response.data
                },
                function (error) {

                    //TESTING
                    //console.log('Error in get AcademicLevels ' + error);
                }
            )
        };

        // because navigation from a tabpage is weird.
        $scope.goBack = function () {
            $state.go('studentmenu');
        };

        // opens financial responsibility modal if not already accepted
        $scope.verifyFinancialResponsibility = function () {
            if ($scope.cartCount > 0) {
                if (RegistrationService.hasFinancialResponsibility() == false) {

                    //TESTING
                    //console.log("Verify Financial Responsibility");

                    $scope.modal.show();
                }
            } else {
                $state.go('reg.checkout');
            }
        };

        $scope.closeModal = function () {
            $scope.modal.hide();
        };

        $scope.repeatSearch = function (searchTerm) {
            $scope.search.searchText = searchTerm;
            $scope.doSearch();
        };

        $scope.AddSectionDetail = function (res) {
            var promises = [];

            //TESTING
            //console.log("AddSectionDetail");
            //console.log(res);

            for (i = 0; i < res.length; i++) {
                var d = RegistrationService.getSectionDetail(i, res[i].termId, res[i].sectionId);
                promises.push(d);
            }

            return Promise.all(promises).then(
                function (results) {

                    //TESTING
                    //console.log("AddSectionDetail results");
                    //console.log(results);
                    //console.log("AddSectionDetail res");
                    //console.log(res);

                    for (ii = 0; ii < res.length; ii++) {
                        res[ii].scheduleType = results[ii].data.scheduleType;
                        res[ii].scheduleTypeDescription = results[ii].data.scheduleTypeDescription;
                    }

                    //TESTING
                    //console.log("AddSectionDetail Controller loop finished");
                    //console.log(res);

                    RegistrationService.setSearchResults(res);
                });
        };

        // execute course search using patterns, terms, and other optional filters
        $scope.doSearch = function () {
			// Check that the search string is not null and it is not a blank filled string
            if ($scope.search.searchText != null && $scope.search.searchText.trim()) {
                UtilityService.showLoading('Searching...');
                RegistrationService.searchCourses($scope.search.searchText, $scope.search.selectedTerm).then(
                    function (result) {
                        if (result.status != 0) {

                            //TESTING
                            //console.log("doSearch result.status != 0");
                            //console.log(result);

                            RegistrationService.setSearchResults(result.data.sections);
                            if (RegistrationService.searchResults().length > 0) {

                                //TESTING
                                //console.log("getSectionDetail Controller");
                                //console.log("SEARCH RESULTS BEFORE SECTION DETAIL");
                                //console.log(RegistrationService.searchResults());

                                RegistrationService.getSectionDetail(RegistrationService.searchResults(), "SEARCH").then(
                                    function (results) {
                                        $state.go('reg.search_results');

                                        //TESTING
                                        //console.log(results);

                                        //UtilityService.hideLoading();
                                        if (result.data.sections.length > 0) {  // save successful searches only
                                            if ($scope.search.recentSearches.indexOf($scope.search.searchText) < 0) {

                                                //TESTING
                                                //console.log($scope.search.selectedTerm);

                                                $scope.search.recentSearches.push($scope.search.searchText);
                                            }
                                        }
                                    }
                                );
                            } else {
                                UtilityService.hideLoading();
                                UtilityService.showError('No result found.  Try another course name.');
                            }
                        }
                    },
                    function (error) {

                        //TESTING
                        //console.log("Error in doSearch " + error);

                        UtilityService.hideLoading();
                        UtilityService.showError("Course Search Error, Please Try Again")
                    })
                    .finally(function () {
                        //UtilityService.hideLoading();
                        //$state.go('reg.search_results');
                    })
            } else {
				UtilityService.showError('Blank search is not accepted.');
			}
        };

        $scope.showSectionDetail = function (course) {
            RegistrationService.setDetailCourse(course);
            $state.go('reg.section_detail');
        };

        //Get registration terms on search entry
        //$scope.$on('$ionicView.enter', function () {
        $scope.$on("$ionicView.enter", function (event, data) {

            //TESTING
            //console.log("//////STATE PARAMS RegistrationCtrl: ", data.stateParams);
            //console.log(data);
            //console.log(data.stateName);
            //console.log("EVENT");
            //console.log(event);
            //direction swap

            UtilityService.hideLoading();
            if (AuthenticationService.isLoggedIn()) {
                //Check for active term first and if not set (null)
                //then getStudentTerms() will get all active terms
                //otherwise this will remember the last term selected
                //when this page is accessed again
                if (RegistrationService.getActiveTerm() == null) {

                    //TESTING
                    //console.log("Reg Null");

                    //Get All Active Student Terms
                    getStudentTerms();
                } else {

                    //TESTING
                    //console.log("Reg Term already set");
                    //var x = RegistrationService.getActiveTerm();
                    //console.log(x.name);
                }

                //TESTING
                //console.log("Registration Search onEnter - Selected Term Default");
            }
        });

        $scope.$on('$ionicView.leave', function () {
            //UtilityService.hideLoading();
        })
    });