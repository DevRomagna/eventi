var Person = require("./person");

describe("Person", () => {
    var p;
    beforeEach(() => {
        p = new Person('Pippo');
    });

    test("...exists", () => {        
        expect(p).toBeDefined();
    });

    test("...has a name", () => {
        expect(p.name).toBeDefined();
    });

    test("...gets name", () => {
        expect(p.getName()).toBe('Pippo');
    });

    test("...says name", () => {
        //var getName = ;
        p.getName = jest.fn();
        p.getName.mockReturnValue("Pluto");
        p.logThings = jest.fn();
        p.sayName();
        expect(p.getName).toBeCalled();
        expect(p.logThings).toBeCalledWith("Pluto");

    });
});
