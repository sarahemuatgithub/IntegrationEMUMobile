describe('AthleticsMenuCtrl', function () {

  var scope;
  var controller;
  var $controller;

  beforeEach(module('emuMobile.controllers'));

  beforeEach(inject(function (_$controller_) {
    $controller = _$controller_;
  }));

  beforeEach(inject(function ($rootScope) {
    //new a $scope
    scope = $rootScope.$new();
    controller = $controller('AthleticsMenuCtrl', { $scope: scope });
  }));

  it('should exist', function() {
    expect(controller).toBeDefined();
  });

  it('should define terms', function() {
    expect(scope.menuName).toEqual('Athletics');
  })



});
