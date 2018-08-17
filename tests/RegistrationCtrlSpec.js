describe('StudentGradesCtrl', function () {

  var scope;
  var mockRegistrationService;
  var controller;

  beforeEach(module('emuMobile.controllers', function ($provide) {

    mockRegistrationService = {
      terms: function () {
        return {
          "terms": [
            {
              "id": "2013/FA",
              "name": "2013 Fall Term",
              "startDate": "2013-08-23",
              "endDate": "2013-12-12"
            }
          ]
        };
      },
      eligibility: function () {
        return {
          "eligible": true,
          "messages": [
            {
              "message": "Text message",
              "courseName": null,
              "courseSectionNumber": null
            }
          ]
        }
      }
    };

    $provide.value('RegistrationService', mockRegistrationService);
  }))


  beforeEach(inject(function ($rootScope, $controller) {
    scope = $rootScope.$new();
    controller = $controller('RegistrationCtrl', {
      $scope: scope,
      RegistrationService: mockRegistrationService
    });
  }))

  it('should exist', function () {
    expect(controller).toBeDefined();
  });

  it('should have scope', function () {
    expect(scope).toBeDefined();
  })

  it('should return terms with one items', function () {
    controller.getTerms();
    expect(scope.terms.length).toEqual(3);
    expect(scope.terms[0]).id.toEqual('2013/FA');
  })

  it('should return eligibility = true', function(){
    controller.getEligibility();
    expect(scope.isEligibile).toBeTrue();
    // look for messages too?
  })

  it('should return list of academic terms', function(){
    controller.getAcademicTerms();
    expect(scope.academicTerms.length).toEqual(2);
  })

  /* actually this should open a modal
  it('should return false', function(){
    controller.
  })*/




});
