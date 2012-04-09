var PoolBase = require_lib('test-agent/pool-base.js');

if(PoolBase){
  var PoolBase = result.TestAgent.PoolBase;
}


describe("test-agent/pool", function(){


  var subject,
      PoolBase,
      wasChecked,
      factory = {},
      detailsGiven,
      object,
      last = {key: 0, value: 0};

  factory.object = testSupport.factory({
    key: function(){
      return "key - " + String(last.key++);
    },

    value: function(){
      return "value - " + String(last.value++);
    }
  }, Object);

  beforeEach(function(){
    object = factory.object();
    PoolBase = PoolBase || TestAgent.PoolBase;
    subject = new PoolBase();

    wasChecked = false;
    detailsGiven = false;

    subject.objectDetails = function(){
      detailsGiven = true;
      return PoolBase.prototype.objectDetails.apply(this, arguments);
    };

    subject.checkObjectValue = function(){
      wasChecked = true;
      return PoolBase.prototype.checkObjectValue.apply(this, arguments);
    };
  });

  describe("initializer", function(){
    it("should set ._items to an empty object", function(){
      expect(subject._items).to.eql({});
    });
  });

  describe(".checkObjectValue", function(){
    var result;
    beforeEach(function(){
      result = subject.checkObjectValue();
    });

    it("should return true", function(){
      expect(subject.checkObjectValue()).to.be(true);
    });

    it("should haven notified test that object was checked", function(){
      expect(wasChecked).to.be(true);
    });
  });

  describe(".objectDetails", function(){
    var object, result;

    beforeEach(function(){
      object = {'zomg': true};
      result = subject.objectDetails(object);
    });

    it("should return given", function(){
      expect(result).to.be(object);
    });

    it("should haven notified test details where given", function(){
      expect(detailsGiven).to.be(true);
    });
  });

  describe(".add", function(){

    beforeEach(function(){
      subject.add(object);
    });

    it("should add object into ._items", function(){
      expect(subject._items[object.key]).to.be(object.value);
    });
  });

  describe(".remove", function(){
    beforeEach(function(){
      subject.add(object);
      expect(subject.has(object));
      subject.remove(object);
    });

    it("should remove given object if its in items", function(){
      expect(subject.has(object)).to.be(false);
    });

    it("should not fail when given object no in the collection", function(){
      subject.remove({});
    });
  });

  describe(".has", function(){

    beforeEach(function(){
      subject.add(object);
    });

    it("should return true when object has been added", function(){
      expect(subject.has(object)).to.be(true);
    });

    it("should return false when object has not been added", function(){
      expect(subject.has({})).to.be(false);
    });
  });

  describe(".each", function(){

    describe("when checkObjectValue returns false", function(){
      var called;

      beforeEach(function(){
        subject.checkObjectValue(function(object){
          return false;
        });

        called = false;
        subject.each(function(){
          called = true;
        });
      });

      it("should not call callback", function(){
        expect(called).to.be(false);
      });

    });

    describe("when multiple elements are in the collection", function(){

      var objects, eachCall = [];

      beforeEach(function(){
        objects = [factory.object(), factory.object()];
        subject.add(objects[0]);
        subject.add(objects[1]);
        eachCall = [];

        subject.each(function(){
          eachCall.push(Array.prototype.slice.call(arguments));
        });
      });

      it("should call each object with value, key", function(){
        expect(eachCall[0][0]).to.be(objects[0].value);
        expect(eachCall[0][1]).to.be(objects[0].key);

        expect(eachCall[1][0]).to.be(objects[1].value);
        expect(eachCall[1][1]).to.be(objects[1].key);
      });
      
    });

  });

});
