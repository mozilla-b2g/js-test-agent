require_lib('test-agent/inspect.js');

//the intent is to ensure inspect works
//wherver we are running this test but we
//don't go very deep into the details of how it works.
describe('test-agent/inspect', function() {

  var object = {
    error: 'zomg',
    details: {
      one: true,
      two: Date.now(),
      three: ['1', '2', '3']
    }
  };

  describe('.inspect', function() {
    describe('without color', function() {
      it('should return formatted string', function() {
        var result = TestAgent.inspect(object);
        expect(result).to.contain('error');
        expect(result).to.contain('details');
        expect(result).to.contain('three');
      });
    });

    describe('with color', function() {
      it('should return formatted string', function() {
        var result = TestAgent.inspect(object, false, 2, true);
        expect(result).to.contain('error');
        expect(result).to.contain('details');
        expect(result).to.contain('three');
      });
    });
  });

});
