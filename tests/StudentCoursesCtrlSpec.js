describe('StudentCoursesCtrl', function () {

  var scope;
  var mockStudentService;
  var mockFakeService;
  var controller;

  beforeEach(module('emuMobile.controllers', function ($provide) {

    mockFakeService = {
      courses: function () {
        return {
          coursesDays: ['Mon','Tue','Fri']
        };
      }
    };

    $provide.value('StudentService', mockStudentService);
    $provide.value('FakeDataService', mockFakeService);
  }))


  beforeEach(inject(function($rootScope, $controller) {
    scope = $rootScope.$new();
    controller = $controller('StudentCoursesCtrl', {$scope: scope, StudentService:mockStudentService, FakeDataService:mockFakeService});
  }))

  it('should exist', function() {
    expect(controller).toBeDefined();
  });

  it('should have scope', function() {
    expect(scope).toBeDefined();
  })

  it('should return coursedays with three items', function() {
    expect(scope.coursesDays.length).toEqual(3);
    expect(scope.coursesDays[2]).toEqual('Fri');
  })



});
