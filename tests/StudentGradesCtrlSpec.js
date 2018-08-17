describe('StudentGradesCtrl', function () {

  var scope;
  var mockStudentService;
  var mockFakeService;
  var controller;

  beforeEach(module('emuMobile.controllers', function ($provide) {

    mockFakeService = {
      grades: function () {
        return {
          terms: ['a','b','c']
        };
      }
    };

    $provide.value('StudentService', mockStudentService);
    $provide.value('FakeDataService', mockFakeService);
  }))


  beforeEach(inject(function($rootScope, $controller) {
    scope = $rootScope.$new();
    controller = $controller('StudentGradesCtrl', {$scope: scope, StudentService:mockStudentService, FakeDataService:mockFakeService});
  }))

  it('should exist', function() {
    expect(controller).toBeDefined();
  });

  it('should have scope', function() {
    expect(scope).toBeDefined();
  })

  it('should return terms with three items', function() {
    expect(scope.terms.length).toEqual(3);
    expect(scope.terms[0]).toEqual('a');
  })



});
