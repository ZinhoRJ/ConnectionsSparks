const timeFunction = () => {
    try {
        const currentDate = new Date();

    Date.prototype.timeNow = function () {
        return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
    };

    return console.log(currentDate.timeNow());
    } catch (error) {
        console.log(error);
    }
    
};

module.exports = timeFunction;