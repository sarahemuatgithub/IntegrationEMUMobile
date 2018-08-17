angular.module('emuMobile.services', [])

    .service('APIInterceptor', function ($rootScope, $injector, $templateCache) {
        // should I be getting this from cloud config?
        var authServices = ['grades', 'courses', 'financial', 'registration'];
        var containsAny = function (str, substrings) {
            for (var i = 0; i != substrings.length; i++) {
                var substring = substrings[i];
                if (str.indexOf(substring) != -1) {
                    return substring;
                }
            }
            return null;
        };

        return {

            // services not needing auth shouldn't send Authorization header
            request: function (req) {
                if (req.method === 'GET' && $templateCache.get(req.url) === undefined) {
                    if ($injector.get('AuthenticationService').isLoggedIn() == true) {  // damn circular reference
                        if (containsAny(req.url, authServices) == null) {
                            delete req.Authorization;
                        } else {
                            req.Authorization = $injector.get('AuthenticationService').authToken;
                        }
                    }
                }
                return req;
            },

            // added forbidden for re-login; responds to not found and unauthorized
            //TODO: Incorrect login state only working on Android, additional error handling added to loginCtrl, make both operate the same if possible
            responseError: function (response) {
                if ((response.status === 401) || (response.status === 403)) {
                    if (response.status === 403) {
                        $rootScope.$broadcast('unauthorized', {message: "Session expired"});
                    } else {
                        $rootScope.$broadcast('unauthorized', {message: "Incorrect Login or Password, Please retry."});
                    }
                    window.location = "#/login/logout";
                } else {
                    return response;
                }
            }
        }
    })

    //Reference
    //https://github.com/alexcrack/angular-ui-notification
    .service('UtilityService',
        function ($localStorage, $rootScope, $timeout, $ionicLoading, $http, appConfig, Notification) {
            return {
                canceller: function () {
                    return $rootScope.canceller;
                },
                showLoading: function (templateText) {

                    //TESTING
                    //console.log("UtilityService showLoading - services.js");

                    var templateView =
                        '<button class="button button-clear" style="font-weight: bold; ' +
                        'line-height: 200%; min-height: 0; min-width: 0;" ' +
                        'ng-click="$root.cancelRequests()">' +
                        '<i class="ion-close-circled">' +
                        '</i>   ' + templateText + '</button><br><ion-spinner></ion-spinner>';

                    $ionicLoading.show({
                        template: templateView
                    });
                },
                hideLoading: function () {
                    $ionicLoading.hide();
                },
                showSuccess: function (msg) {

                    //TESTING
                    //console.log("showSuccess");

                    //TESTING
                    //console.log("UtilityService showSuccess");

                    msg = msg + '<br>&nbsp<p style="text-align: center;">Click Here To Close</p>';
                    Notification.success({message: msg, closeOnClick: true, delay: 100000000})
                },
                showError: function (msg) {

                    //TESTING
                    //console.log("UtilityService showError");

                    msg = msg + '<br>&nbsp<p style="text-align: center;">Click Here To Close</p>';
                    Notification.error({message: msg, closeOnClick: true, delay: 100000000});
                },
                showWarning: function (msg) {

                    //TESTING
                    //console.log("UtilityService showError");

                    msg = msg + '<br>&nbsp<p style="text-align: center;">Click Here To Close</p>';
                    Notification.warning({message: msg, closeOnClick: true, delay: 100000000});
                },
                clearMsgs: function () {
                    Notification.clearAll()
                }
/*                getImage: function () {
                    var url = appConfig.mobileApiUrl + "/api/2.0/image/E01040746" //+  AuthenticationService.currentUser().authId;
                    return $http.get(url);
                }*/
            }
        })

    .service('AuthenticationService',
        function (EncodingService, $injector, $q, appConfig, $rootScope, $localStorage, $timeout) {
            var currentUser = {};
            var authdata = "";
            var $http = $injector.get('$http');
            var persistentLogin = $localStorage;

            var loginTimeout = $q.defer();
            var cancelLogin = function () {
                loginTimeout.resolve();
                loginTimeout = $q.defer();
            };

            return {

                login: function (username, password) {
                    if (username != undefined && password != undefined) {

                        //TESTING
                        //console.log('SERVICES login start');

                        this.ClearCredentials();
                        $timeout(cancelLogin, 20000); // 20 sec timeout
                        authdata = EncodingService.encodeb64(username + ':' + password);
                        $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;

                        //TESTING
                        var x = appConfig.mobileApiUrl + '/api/2.0/security/getUserInfo';
                        //console.log("authentication service login");
                        //console.log(x);
                        return $http.get(x, {timeout: loginTimeout.promise});
                    } else {
                        return $q.reject("Login Credentials Incorrect");
                    }

                },

                authToken: function () {
                    return authdata;
                },

                isLoggedIn: function () {
                    if (currentUser.hasOwnProperty('userId') == false) {
                        if (persistentLogin.currentUser != undefined) {
                            currentUser = persistentLogin.currentUser;
                            authdata = persistentLogin.authdata;
                            //$http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;
                        }
                    }
                    return currentUser.hasOwnProperty('userId');
                },

                setCredentials: function (credentials) {
                    currentUser = {
                        userId: credentials.data.authId,
                        authId: credentials.data.userId,
                        roles: credentials.data.roles
                    };
                    $rootScope.authToken = authdata;
                    persistentLogin.authdata = authdata;
                    persistentLogin.currentUser = currentUser;
                },

                // Erase credentials
                ClearCredentials: function () {
                    currentUser = {};
                    authdata = "";
                    $localStorage.$reset();
                    $http.defaults.headers.common.Authorization = 'Basic ';
                },

                logout: function () {
                    var url = appConfig.mobileApiUrl + "/api/2.0/security/logout";
                    //$http.defaults.headers.common.Authorization = 'Basic ';
                    return $http.post(url);
                },

                currentUser: function () {
                    return currentUser;
                }
            }
        })

    .service('MapService', function ($http, appConfig) {
        //Full campus JSON url for postman or hurl.it
        //https://elluciangotest.emich.edu/banner-mobileserver/api/2.0/campus/1427
        //Full building JSON url for postman or hurl.it
        //https://elluciangotest.emich.edu/banner-mobileserver/api/2.0/building/1427
        //Individual JSON URL for building
        //https://elluciangotest.emich.edu/banner-mobileserver/api/2.0/building/1427/PRAY-H

        return {
            getBuildings: function (buildingId) {
                var url = appConfig.mobileApiUrl + '/api/2.0/building';

                if (!appConfig.configId) {
                    // throw an error
                    //console.log("config error");
                } else {
                    url += '/' + appConfig.configId;
                }


                if (buildingId) {
                    url += '/' + buildingId;
                }

                if (!buildingId) {
                }

                return $http.get(url);
            }
        };
    })

    //Example
    //https://elluciangotest.emich.edu/banner-mobileserver/api/2.0/directory/search/faculty,student?searchString=Grover
    .service('DirectoryService', function ($q, $http, appConfig, AuthenticationService, UtilityService) {

        return {
            search: function (searchTerm) {
                var searchUrl = appConfig.mobileApiUrl + '/api/2.0/directory/search/faculty,student?searchString=' + searchTerm;

                //TESTING
                //console.log("Directory searchURL");
                //console.log(searchUrl);

                var request = {
                    method: 'GET',
                    url: searchUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()
                };

                return $http(request);

                //TESTING
                //var x = $http(request);
                //console.log("DirectoryService response");
                //console.log(x);
                //return x;
            }
        }
    })

    .service('EventsService', function ($http, appConfig) {

        return {

            // https://xedocs.ellucian.com/mobile-server-api/events.html#get-all
            events: function () {
                var url = appConfig.mobileApiUrl + '/rest/events';
                return $http.get(url)
            }

            // https://xedocs.ellucian.com/mobile-server-api/events.html#event-calendars
/*            eventList: function () {
                var url = appConfig.mobileApiUrl + '/rest/events/calendars/list';
                return $http.get(url);
            },*/

            // https://xedocs.ellucian.com/mobile-server-api/events.html#event-categories
 /*           eventCategories: function () {
                var url = appConfig.mobileApiUrl + '/rest/events/categories/list';
                return $http.get(url);
            }*/
        }
    })

    .service('RegistrationService', function ($q, $http, appConfig, AuthenticationService, EncodingService, UtilityService) {

        //TESTING
        //https://elluciangoqual.emich.edu/banner-mobileserver/api/2.0/registration/E01568452/eligibility

        var planningTool = true; // default for now as banner mobileserver doesn't use this tool
        var recentSearches = [];
        var searchResults = [];
        var currentCourse = {};
        var cartSectionDetail = [];
        var activeTerm;
        var altPin;

        var createCartRequest = function (course, action) {
            var reqBody = {
                "planId": "mobileserver_proxy_plan_id",
                "terms": []
            };
            var modTerm = {
                "termId": course.termId,
                "sections": []
            };
            var modCourse =
                {
                    "sectionId": course.sectionId,
                    "action": action,
                    "gradingType": course.gradingType,
                    "credits": course.credits,
                    "ceus": course.ceus
                };
            reqBody.terms.push(modTerm);
            reqBody.terms[0].sections.push(modCourse);
            return reqBody;
        };

        return {

            setAltPin: function (pin) {
                altPin = pin;
            },
            getAltPin: function () {
                return altPin;
            },

            setActiveTerm: function (term) {
                activeTerm = term;
            },

            getActiveTerm: function () {
                return activeTerm;
            },

            setDetailCourse: function (course) {

                //TESTING
                //console.log("RegistrationService.setDetailCourse");
                //console.log(course);

                currentCourse = course;
            },

            getDetailCourse: function () {

                //TESTING
                //console.log("RegistrationService.getDetailCourse");
                //console.log(currentCourse);

                return currentCourse;
            },

            setCartResults: function (results) {
                cartSectionDetail = results;
            },
            cartResults: function () {
                return cartSectionDetail;
            },

            setSearchResults: function (results) {
                searchResults = results;
            },
            searchResults: function () {
                return searchResults;
            },

/*            addRecentSearches: function (searchString) {
                recentSearches.push(searchString);
            },*/

            recentSearches: function () {
                return recentSearches;
            },

            hasFinancialResponsibility: function (term) {
                var requestUrl = appConfig.mobileApiUrl + '/api/2.0/registration/' + AuthenticationService.currentUser().authId + '/getFinancialResponsibilityForTerm/termId/' + term.id;
                var request = {
                    method: 'GET',
                    url: requestUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()  // this is where we do our magic
                };

                //TESTING
                //console.log('services hasFinancialResponsibility');
                //console.log(requestUrl);

                var x = $http(request);

                //TESTING
                //console.log("hasFinancialResponsibility x");
                //console.log(x);

                return x;
            },

            terms: function () {
                var requestUrl = appConfig.mobileApiUrl + '/api/2.0/registration/' + AuthenticationService.currentUser().authId + '/terms';
                var request = {
                    method: 'GET',
                    url: requestUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()  // this is where we do our magic
                };
                return $http(request);
            },

            acceptFinancialResponsibility: function (term) {
                //var termID = term;

                //THIS IS THE ENDPOINT FOR ACCEPTING FINANCIAL RESPONSIBILITY
                ///api/2.0/registration/$personId/acceptFinancialResponsibilityForTerm/termId?/$termId

                var requestUrl = appConfig.mobileApiUrl + '/api/2.0/registration/' + AuthenticationService.currentUser().authId + '/acceptFinancialResponsibilityForTerm/termId/' + term.id;

                //TESTING
                //console.log('Setting acceptFinancialResponsibility');
                //https://elluciangoqual.emich.edu/banner-mobileserver/api/2.0/registration/E01568452/acceptFinancialResponsibilityForTerm/termId/201850
                //console.log(requestUrl);

                //TESTING
                //console.log("Term as object");
                //console.log(term);
                //console.log("TERMID to pass to URI");
                //console.log(term.id);

                var request = {
                    method: 'GET',
                    url: requestUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()  // this is where we do our magic
                };

                //TESTING
                //var x = $http(request);
                //console.log(x);
                //return x;

                return $http(request);
            },

            academicLevels: function () {
                var requestUrl = appConfig.mobileApiUrl + '/api/2.0/registration/academic-levels';
                var request = {
                    method: 'GET',
                    url: requestUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()  // this is where we do our magic
                };
                return $http(request);
            },

            eligibility: function () {
                var requestUrl = appConfig.mobileApiUrl + '/api/2.0/registration/' + AuthenticationService.currentUser().authId + '/eligibility';

                //TESTING
                //console.log('Registration Service - Eligibility TESTING');
                //console.log(requestUrl);

                var request = {
                    method: 'GET',
                    url: requestUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()  // this is where we do our magic
                };
                return $http(request);
            },

            plans: function (termId) {
                var data = {
                    'planningTool': true,
                    'term': termId
                };
                var requestUrl = appConfig.mobileApiUrl + '/api/2.0/registration/' + AuthenticationService.currentUser().authId + '/plans?' + EncodingService.encodeUrlData(data);
                var request = {
                    method: 'GET',
                    url: requestUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()  // this is where we do our magic
                };

                //TESTING
                //https://elluciangoqual.emich.edu/banner-mobileserver/api/2.0/registration/E01568452/plans?planningTool=true&term=201720
                //console.log('plans - Services');
                //console.log(requestUrl);

                return $http(request);

                //TESTING
                //var x = $http(request);
                //console.log("plans");
                //console.log('x');
                //console.log(x);
                //return x;
            },

            registerCourses: function (regData) {
                var data = {
                    'planningTool': true
                };

                var regUrl = appConfig.mobileApiUrl + '/api/2.0/registration/' + AuthenticationService.currentUser().authId + '/register-sections?' + EncodingService.encodeUrlData(data);

                //TESTING - this should return altPin in SectionRegistrations Request Body
                //Registration API from Ellucian
                //console.log('regURL RegisterCourses ');
                //console.log(data);
                //console.log(regUrl); //get response here for alt pin here
                //console.log(regData);

                return $http.put(regUrl, regData);

                //TESTING altpin handling here
                //var x = $http.put(regUrl, regData);
                //return message from promise and process
                //Promise.$$state.value.data.messages[].message = 'Your PIN is invalid."
                //prompt to enter/change pin
                //console.log("x RegistrationService.registerCourses ");
                //console.log(x);
                //return x;
            },

/*            addDrop: function (courseActions) {

            },*/

            /*  Might not need this one since Banner has the cart function
             register: function () {
             var url = '/api/2.0/registration/' + AuthenticationService.currentUser().authId + '/register-sections?' +
             EncodingService.encodeUrlData({'planningTool': false});
             return $http.post(url,requestBody);
             },*/
            //'https://elluciangotest.emich.edu/banner-mobileserver/api/2.0/registration/T00000005/search-courses?pattern='Bio'&term=201710'

            searchCourses: function (pattern, term, acadLevels, locations) { //, acadLevels, locations, requestBody) {
                var data = {
                    'pattern': pattern,
                    'term': term.id,
                    'academicLevels': acadLevels || null,
                    'locations': locations || null
                };
                var requestUrl = appConfig.mobileApiUrl + '/api/2.0/registration/' + AuthenticationService.currentUser().authId + '/search-courses?' +
                    EncodingService.encodeUrlData(data);

                //TESTING
                //console.log("RegistrationService.searchCourses");
                //console.log(requestUrl);

                var request = {
                    method: 'GET',
                    url: requestUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()  // this is where we do our magic
                };

                return $http(request);

                //TESTING
                //var x = $http(request);
                //console.log("Registration Request Data");
                //console.log(x);
                //return x;
            },

            //http://davidcai.github.io/blog/posts/angular-promise/
            getSectionDetail: function (res, event) { //

                //TESTING
                //console.log('getsectiondetail type');
                //console.log(res);

                var self = this;
                var termid = res[0].termId;

                //TESTING
                //console.log(this);
                //console.log("res getsectiondetail");
                //console.log(res);
                //console.log(res[0].termId);
                //console.log(res[0].sectionId);

                var promises = [];

                for (var i = 0; i < res.length; i++) {
                    var crn = res[i].sectionId;
                    var requestUrl = appConfig.mobileApiUrl + '/api/2.0/registration/' + AuthenticationService.currentUser().authId + '/termsSD/' + termid + '/crn/' + crn;
                    var d = $http.get(requestUrl).then(
                        function (response) {

                            //TESTING
                            //console.log("i=",i);
                            //console.log(requestUrl);
                            //console.log(response);

                            return response.data;
                        }
                    );
                    promises.push(d);
                }

                return Promise.all(promises).then(
                    function (results) {

                        //TESTING
                        //console.log("results");
                        //console.log(results);
                        //console.log("res");
                        //console.log(res);
                        //console.log("added");

                        for (var ii = 0; ii < res.length; ii++) {

                            //TESTING
                            //connsole.log("ii = "+ii);
                            //console.log(results[ii].scheduleType);

                            //addional data from Section Details (results)
                            res[ii].scheduleType = results[ii].scheduleType;
                            res[ii].scheduleTypeDescription = results[ii].scheduleTypeDescription;
                            res[ii].campus = results[ii].campus;
                            res[ii].campusDescription = results[ii].campusDescription;
                            res[ii].creditHours = res[ii].minimumCredits;
                        }

                        //TESTING
                        //console.log("section detail end");
                        //console.log(res);

                        if (event == "SEARCH") {
                            self.setSearchResults(res);
                        }
                        else {
                            self.setCartResults(res);
                        }
                    });
            },

            modifyCart: function (course, action) {
                var cartRequest = createCartRequest(course, action);
                var url = appConfig.mobileApiUrl + '/api/2.0/registration/' + AuthenticationService.currentUser().authId + '/update-cart?planningTool=true';
                return $http.put(url, cartRequest);
            }
        }
    })

    //https://xedocs.ellucian.com/mobile-server-api/finances.html
    .service('StudentService', function ($http, appConfig, UtilityService, AuthenticationService) {
        return {
            balances: function () {
                var url = appConfig.mobileApiUrl + "/api/2.0/finance/" + AuthenticationService.currentUser().authId + "/balances";
                return $http.get(url);

                //TESTING
                //var x = $http.get(url);
                //console.log("balances");
                //console.log(url);
                //console.log(x);
                //return x;
            },

            transactions: function () {
                var url = appConfig.mobileApiUrl + "/api/2.0/finance/" + AuthenticationService.currentUser().authId + "/transactions";
                return $http.get(url)
            },

            grades: function (termId) {
                //https://xedocs.ellucian.com/mobile-server-api/grades.html
                var requestUrl = appConfig.mobileApiUrl + "/api/2.0/grades/" + AuthenticationService.currentUser().authId;
                if (termId) {
                    requestUrl += "?term=" + termId;
                }
                var request = {
                    method: 'GET',
                    url: requestUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()  // this is where we do our magic
                };
                return $http(request);
            },

            courses: function (startDate, endDate) {
                var range = "";
                if (startDate) {
                    range += "?start=" + startDate;
                    if (endDate) {
                        range += "&end=" + endDate;
                    }
                }
                var requestUrl = appConfig.mobileApiUrl + "/api/2.0/courses/calendarview/" + AuthenticationService.currentUser().authId + range;
                var request = {
                    method: 'GET',
                    url: requestUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()  // this is where we do our magic
                };
                return $http(request)
            },

            coursesfullview: function (termId) {
                var range = "";
                if (termId) {
                    range += "?term=" + termId;
                }
                var requestUrl = appConfig.mobileApiUrl + "/api/2.0/courses/fullview/" + AuthenticationService.currentUser().authId + range;
                var request = {
                    method: 'GET',
                    url: requestUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()  // this is where we do our magic
                };

                return $http(request);

                //TESTING
                //var x = $http(request);
                //console.log("coursefullview");
                //console.log(x);
                //return x;
            }

/*            courseoverview: function (termId, sectionId) {
                var range = "";
                if (termId) {
                    range += "?term=" + termId;
                    if (sectionId) {
                        range += "&section=" + sectionId;
                    }
                }
                var requestUrl = appConfig.mobileApiUrl + "/api/2.0/courses/overview/" + AuthenticationService.currentUser().authId + range;
                var request = {
                    method: 'GET',
                    url: requestUrl,
                    timeout: UtilityService.canceller().promise,
                    cancel: UtilityService.canceller()  // this is where we do our magic
                };
                return $http(request);
            }*/
        }
    })

    .service('FeedService', function ($http, $q, appConfig) {
        return {
/*            feedNames: function () {
                return $q(function (resolve, reject) {
                    var url = appConfig.mobileApiUrl + '/rest/1.2/feed/names';
                    $http.get(url)
                        .success(function (data) {
                            resolve(data);
                        }).error(function (msg) {
                        reject(msg);
                    });
                })
            },*/

            parseFeed: function (feedName) {
                var url = appConfig.mobileApiUrl + '/rest/1.2/feed';
                if (feedName) {
                    url += '/' + feedName
                }

                return $q(function (resolve, reject) {
                    $http.get(url)
                        .success(function (data) {
                            resolve(data);
                        }).error(function (msg) {
                        reject(msg);
                    });
                });
            }
        }
    })

    //https://andrew.stwrt.ca/posts/js-xml-parsing/
    .service('ParseXMLFeed', function () {

        // flattens an object (recursively!), similarly to Array#flatten
        // e.g. flatten({ a: { b: { c: "hello!" } } }); // => "hello!"
        var flatten = function (object) {
            var check = _.isPlainObject(object) && _.size(object) === 1;
            return check ? flatten(_.values(object)[0]) : object;
        };

        return {
            parse: function (xml) {
                var data = {};

                var isText = xml.nodeType === 3,
                    isElement = xml.nodeType === 1,
                    body = xml.textContent && xml.textContent.trim(),
                    hasChildren = xml.children && xml.children.length,
                    hasAttributes = xml.attributes && xml.attributes.length;

                // if it's text just return it
                if (isText) {
                    return xml.nodeValue.trim();
                }

                // if it doesn't have any children or attributes, just return the contents
                if (!hasChildren && !hasAttributes) {
                    return body;
                }

                // if it doesn't have children but _does_ have body content, we'll use that
                if (!hasChildren && body.length) {
                    data.text = body;
                }

                // if it's an element with attributes, add them to data.attributes
                if (isElement && hasAttributes) {
                    data.attributes = _.reduce(xml.attributes, function (obj, name, id) {
                        var attr = xml.attributes.item(id);
                        obj[attr.name] = attr.value;
                        return obj;
                    }, {});
                }

                // recursively call #parse over children, adding results to data
                _.each(xml.children, function (child) {
                    var name = child.nodeName;

                    // if we've not come across a child with this nodeType, add it as an object
                    // and return here
                    if (!_.has(data, name)) {
                        data[name] = parse(child);
                        return;
                    }

                    // if we've encountered a second instance of the same nodeType, make our
                    // representation of it an array
                    if (!_.isArray(data[name])) {
                        data[name] = [data[name]];
                    }

                    // and finally, append the new child
                    data[name].push(parse(child));
                });

                // if we can, let's fold some attributes into the body
                _.each(data.attributes, function (value, key) {
                    if (data[key] != null) {
                        return;
                    }
                    data[key] = value;
                    delete data.attributes[key];
                });

                // if data.attributes is now empty, get rid of it
                if (_.isEmpty(data.attributes)) {
                    delete data.attributes;
                }

                // simplify to reduce number of final leaf nodes and return
                return flatten(data);
            }
        }
    })

    .service('xmlservice', ['$http', function ($http) {
        return {
            get: function (path) {
                return $http.get(path);
            }
        }
    }
    ])

    .service('NumbersServices', function ($http, appConfig) {
        var configId = appConfig.configId;
        return {

            numbers: function () {
                var url = appConfig.mobileApiUrl + '/api/2.0/numbers';
                if (!configId) {
                    // throw an error
                } else {
                    url += '/' + configId;
                }

                //TESTING
                //console.log("NumbersServices URL = "+url);

                return $http.get(url);
            }
        }
    })

    .service('EncodingService', function () {
        /* jshint ignore:start */

        var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        //var keyStr = 'DukeCabEllingtonCountCallowayDaveBasicGeorgeBrubeckBensonYardBird+/=';

        return {

            // Usage:
            //   var data = { 'first name': 'George', 'last name': 'Jetson', 'age': 110 };
            //   var querystring = EncodeQueryData(data);
            // from http://stackoverflow.com/questions/111529/create-query-parameters-in-javascript
            //
            encodeUrlData: function (data) {
                var ret = [];
                for (var d in data) {
                    if (data[d] != null) {
                        ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
                    }
                }
                return ret.join("&");
            },

            encodeb64: function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                do {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output = output +
                        keyStr.charAt(enc1) +
                        keyStr.charAt(enc2) +
                        keyStr.charAt(enc3) +
                        keyStr.charAt(enc4);
                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";
                } while (i < input.length);

                return output;
            }

/*            decodeb64: function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
                var base64test = /[^A-Za-z0-9\+\/\=]/g;
                if (base64test.exec(input)) {
                    window.alert("There were invalid base64 characters in the input text.\n" +
                        "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                        "Expect errors in decoding.");
                }
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                do {
                    enc1 = keyStr.indexOf(input.charAt(i++));
                    enc2 = keyStr.indexOf(input.charAt(i++));
                    enc3 = keyStr.indexOf(input.charAt(i++));
                    enc4 = keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output = output + String.fromCharCode(chr1);

                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }

                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";

                } while (i < input.length);

                return output;
            }*/
        };

        /* jshint ignore:end */
    })

    .filter("asDate", function () {
        return function (input) {
            return new Date(input);
        }
    })

    .filter("ParseNonUTCDate", function () {
        return function (input) {

            return new Date(input.replace(/-/g, '\/'));

            //TESTING
            //console.log("asDate input");
            //console.log(input);

            //date off by one error in non-UTC formatted dates, fixed by the following

            //TESTING
            //var x = new Date(input.replace(/-/g, '\/'));
            //console.log("asDate return");
            //console.log(x);
            //return x;
        }
    })

    .filter("MilitaryAs12HourTime", function () {
            return function (time) {
                var dtParts = time.split(":");

                var hours = dtParts[0];
                var minutes = dtParts[1];
                var suffix = "am";

                if (hours > 12) {
                    hours = hours - 12;
                    suffix = "pm";
                }
                else if (hours == "00") {
                    hours = 12;
                    suffix = "am";
                }
                else if (hours == "12") {
                    suffix = "pm";
                }

                return (hours + ":" + minutes + suffix);
            }
        }
    )

    .filter("openSection", function () {
        return function (section) {
            var space = section.capacity - section.available;
            if (space >= 0) {
                return space + " of " + section.capacity + " seats filled";
            } else {
                if (section.waitlistAvailable == false) {
                    return "Section full";
                } else {
                    return "Section full.  Waitlist available."
                }
            }
        }
    })

    .filter("DOW", function () {
        return function (dayArray) {
            //console.log(dayArray);
            var meetDOW = "";
            //dayArray to three letter DOW string
            for (var i = 0; i < dayArray.length; i++) {
                //console.log("i = "+i + "/" + moment().weekday(section[i] - 1).format('ddd'));
                meetDOW = meetDOW + moment().weekday(dayArray[i] - 1).format('ddd');
            }
            return meetDOW;
        }
    })

    .filter("classMeetups", function () {
        return function (section) {
            if ((section.hasOwnProperty("meetingPatterns") == false) || (section.meetingPatterns.length == 0)) {
                return null;
            }
            var meetDays = "";
            var meetPatterns = section.meetingPatterns;
            var startTime = meetPatterns[0].sisStartTimeWTz.replace('America/New_York', '');
            var endTime = meetPatterns[0].sisEndTimeWTz.replace('America/New_York', '');
            var meetTimes = moment(startTime, ['h:m a', 'H:m']).format('h:mm a') + " - " + moment(endTime, ['h:m a', 'H:m']).format('h:mm a');

            for (var j = 0; j < meetPatterns.length; j++) {
                var meetDOW = meetPatterns[j].daysOfWeek;

                for (var i = 0; i < meetDOW.length; i++) {
                    if (i > 0) {
                        //meetDays += ", " + moment().weekday(meetDOW[i]).format('ddd'); //ORIG
                        meetDays += ", " + moment().weekday(meetDOW[i] - 1).format('ddd'); //TESTING
                    } else {
                        //meetDays += moment().weekday(meetDOW[i]).format('ddd'); //ORIG
                        meetDays += " " + moment().weekday(meetDOW[i] - 1).format('ddd'); //TESTING
                    }
                }
            }
            meetDays += " " + meetTimes;
            if ((meetPatterns.hasOwnProperty('building') == true) && (meetPatterns.buildings != null)) {
                meetDays += " " + meetPatterns.building + " " + meetPatterns.room;
            }
            return meetDays;
        }
    });
