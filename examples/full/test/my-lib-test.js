/* There is a built in require feature */

/* Absolute paths (relative to your server root)
require('/lib/my-file.js')
*/

/* Relative to the location of your sandbox
require('../lib/my-file.js')
*/

require('../lib/my-lib.js');

describe("test-agent", function(){
  it("should work", function(){
    if(!window.MyLib){
      throw new Error("should have a MyLib in window");
    }
  });
});
