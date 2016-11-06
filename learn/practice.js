
//#1 basic use
function mockReadFileFunc(value){
    return new Promise(function(resolve, reject){
        setTimeout(function () {
            console.log(value);
            resolve(value);
        }, 1000);
    });
}

//async operation will write as if they are sync in generator
function*  gen(){
    yield mockReadFileFunc(1);
    yield mockReadFileFunc(2);
    return 'done'
}

co(gen()).then(function(value){

    console.log(value);
});
//1
//2
//done


//#2 throw error

function mockReadFileFunc(value){
    return new Promise(function(resolve, reject){
        setTimeout(function () {
            try {
                console.log(value);
                if (value == 2)
                    reject(new Error("throw in mockReadFileFunc"))
                else
                    resolve(value);
            }catch(e){

                console.log(e.stack);
                throw e;

            }
        }, 1000);
    });
}

function*  gen(){
    yield mockReadFileFunc(1);
    yield mockReadFileFunc(2);
    return 'done'
}

co(gen()).then(function(value){
    console.log(value);
}).catch(function(err){
    console.log(err.stack);
});


//#3 throw error in generator

function mockReadFileFunc(value){
    return new Promise(function(resolve, reject){
        setTimeout(function () {
            //throw new Error('0');  //this error will throw to window
            try {
                console.log(value);
                if (value == 2)
                    reject(new Error("throw in mockReadFileFunc"))    //reject in promise will let gen to throw an error which can be catched in generator, if genenrator not catch, will diliver outside promise catch function
                else
                    resolve(value);
            }catch(e){
                console.log('catch in mockReadFileFunc'+e.stack);      //cannot catch reject
                reject(e);             //will catch by generator
                throw e;  //this error will throw to window
            }
        }, 1000);
    });
}

function*  gen(){
    try {
        yield mockReadFileFunc(1);
        yield mockReadFileFunc(2);
    }catch(err){

        console.log('catch in generator');    //the error throw from promise will catch here
        throw err;                    //an error throwed by generator will be catched by outside promise catch function

    }
    return 'done'
}

co(gen()).then(function(value){
    console.log(value);
}).catch(function(err){
    console.log(err.stack);   //catch error from generator
});

//#4 clear version
function mockReadFileFunc(value){
    return new Promise(function(resolve, reject){
        setTimeout(function () {
            try {
                console.log(value);
                if (value == 2)
                    reject(new Error("throw in mockReadFileFunc"))
                else
                    resolve(value);
            }catch(e){
                console.log('catch in mockReadFileFunc'+e.stack);
                reject(e);
                throw e;
            }
        }, 1000);
    });
}

function*  gen(){
    try {
        yield mockReadFileFunc(1);
        yield mockReadFileFunc(2);
    }catch(err){

        console.log('catch in generator');
        throw err;

    }
    return 'done'
}

co(gen()).then(function(value){
    console.log(value);
}).catch(function(err){
    console.log('catch in outside promise: '+err.stack);
});

//#5 yield array
function mockReadFileFunc(value, interval){
    return new Promise(function(resolve, reject){
        setTimeout(function () {
            console.log(value);
            resolve(value);
        }, interval);
    });
}

//async operation will write as if they are sync in generator
function*  gen(){
    yield [mockReadFileFunc(1, 1000), mockReadFileFunc(2, 2000), mockReadFileFunc(3,1500)];
    yield mockReadFileFunc(4,1000);

    return 'done'
}

co(gen()).then(function(value){

    console.log(value);
});

//#6 yield array, some fail
function mockReadFileFunc(value, interval){
    return new Promise(function(resolve, reject){
        setTimeout(function () {
            console.log(value);
            if(value == 2)
                    reject(new Error('fail when 2'));
            else
                resolve(value);
        }, interval);
    });
}

//async operation will write as if they are sync in generator
function*  gen(){
    yield [mockReadFileFunc(1, 1000), mockReadFileFunc(2, 2000), mockReadFileFunc(3,1500)];
    yield mockReadFileFunc(4,1000);             //this will not run because there is some failure in first yield

    return 'done'
}

co(gen()).then(function(value){

    console.log(value);
}).catch(function(err){

    console.log(err.stack);

});

//#7 yield object

function mockReadFileFunc(value, interval){
    return new Promise(function(resolve, reject){
        setTimeout(function () {
            console.log(value);
            resolve(value);
        }, interval);
    });
}

//async operation will write as if they are sync in generator
function*  gen(){
    yield {
            1:mockReadFileFunc(1, 1000),
            2:mockReadFileFunc(2, 2000),
            3:mockReadFileFunc(3,1500)
        };
    yield mockReadFileFunc(4,1000);

    return 'done'
}

co(gen()).then(function(value){

    console.log(value);
});

//#8 yield thunk, to be noticed that the thunk function should be a funtion with only one argument: callback

function mockThunk1(callback){
    console.log('chunk1 begin');
    setTimeout(function(){
        console.log('chunk1 end');
        callback(null,'thunk1 callback');   //first should be null, otherwise will cause promise's reject
    }, 1000);

}

function mockThunk2(callback){
    console.log('chunk2 begin');
    setTimeout(function(){
        console.log('chunk2 end');
        callback(null,'thunk2 callback');
    }, 2000);

}

function* gen(){

    yield mockThunk1
    yield mockThunk2
    return 'done'


}
co(gen()).then(function(value){

    console.log(value);
});

//#9 yield generator / generator functions

function* mockFunc(value){

    return new Promise(function(resolve, reject){

        setTimeout(function(){

            console.log(value);
            resolve(value);

        },1000);


    });


}

function* yieldedGen(){

    yield mockFunc(1)
    yield mockFunc(2)


}


function* gen(){

    yield mockFunc(0)
    yield yieldedGen
    yield mockFunc(3)
    return 'gen done';

}

co(gen()).then(function(value){

    console.log(value);

});

//#10 objectToPromise

function objectToPromise(obj){
    var results = new obj.constructor();     //a new obj to store all result of promise inside obj
    var keys = Object.keys(obj);                    //get keys
    var promises = [];                     //promise array
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var promise = toPromise.call(this, obj[key]);
        if (promise && isPromise(promise)) defer(promise, key);   //if it can be transferred to a promise, then defer it
        else results[key] = obj[key];           //if it can not be transferred to a promise, then store in results directly, as if is resolved(will not in promises array)
    }
    return Promise.all(promises).then(function () {  //when all promise result is stored, then resolve this promise
        return results;
    });

    function defer(promise, key) {  //defer a promise means call its then function and return the promise returned by then function, so promises array store the thened promise , not original promise
        // predefine the key in the result
        results[key] = undefined;
        promises.push(promise.then(function (res) {     //why should we do that, because we need to store results of a promise before resolve it, so we need to add a chain in the promise link
            results[key] = res;
        }));
    }
}

//conclusion: for object promise, if we assume there is one-level promise, then we will have 3-level promise:
{
    1:Promise.resolve(1)
}

//the yielded Promise is :
var results = {};
Promise.all([Promise.resolve(1).then(function(res){results['1'] = res ; })]).then(function(){return results;});
//this is what co get from the object
//if there is nested structure in object/Array, there will be more level

//#11 yield nested

function* mockFunc(value){

    return new Promise(function(resolve, reject){

        setTimeout(function(){

            console.log(value);
            resolve(value);

        },1000);


    });


}

function* yieldedGen(){

    yield mockFunc(1)
    yield mockFunc(2)


}

function* yieldedGen2(){

    yield mockFunc(7)
    yield mockFunc(8)


}

function* gen(){

    yield mockFunc(0)
    yield [yieldedGen,mockFunc(3)]   //2 is behind 1, but 3 is before 2
    yield mockFunc(4)
    yield {
            1: mockFunc(5),
            2: [mockFunc(6), yieldedGen2, mockFunc(9)],   //sequence is 5,6,7,8
            3: mockFunc(10)
        }
    yield mockFunc(11)
    return 'gen done';

}

co(gen()).then(function(value){

    console.log(value);

});

//out put sequence is : 0, 1,3,2,4,5,6,7,9,10,8,11
//because array and object is parallel, so:
//0->1,3->2->4->5,6,7,9,10->8->11