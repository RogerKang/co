

var promise = new Promise(function(resolve, reject){
    setTimeout(function(){
        resolve("one");
    },1000);
});

promise.then(function(value){
    console.log(value);
    return new Promise(function(resolve, reject){
        setTimeout(function(){
            reject(2);
        },1000);
    });

}).then(function(value){
    console.log(value);
}, function(err){

    console.log('err: '+err.toString());

});



function* g(){

    yield 2;
    yield 3;
    console.log(3);

    return 4;

}