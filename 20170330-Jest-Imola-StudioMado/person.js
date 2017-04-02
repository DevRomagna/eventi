function Person(name) {
    this.name = name;    
}

Person.prototype.logThings = function(things) {
    console.log(things);
};

Person.prototype.sayName = function() {
    this.logThings(this.getName());
};

Person.prototype.getName = function() {
    return this.name;
};



module.exports = Person;