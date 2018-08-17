describe('EventsCtrl', function () {

  var scope;
  var mockEventsService;
  var controller;
  var mockIonLoading;
  var mockIonicModal;

  beforeEach(module('emuMobile.controllers', function ($provide) {

    mockEventsService = {
      events: function () {
        return [];
      }
    };

    $provide.value('EventsService', mockEventsService);
  }))

  beforeEach(inject(function($rootScope, $controller) {
    scope = $rootScope.$new();
    controller = $controller('EventsCtrl', {$scope: scope, $ionicLoading: mockIonLoading,$ionicModal:mockIonicModal,EventsService:mockEventsService});
  }))

  it('should exist', function() {
    expect(controller).toBeDefined();
  });

  it('should have scope', function() {
    expect(scope).toBeDefined();
  })

  it('should move forward, back through events list', function() {
    expect(scope.prevMonth()).toEqual('May');
    expect(scope.nextMonth()).toEqual('Jun');
  })

  it('should only get selected month and year events', function() {
    expect(scope.getEvents()).toEqual([]);
  })



});
