/*
 * Available information:
 * 1. Request queue
 * Simulator.get_instance().get_requests()
 * Array of integers representing floors where there are people calling the elevator
 * eg: [7,3,2] // There are 3 people waiting for the elevator at floor 7,3, and 2, in that order
 * 
 * 2. Elevator object
 * To get all elevators, Simulator.get_instance().get_building().get_elevator_system().get_elevators()
 * Array of Elevator objects.
 * - Current floor
 * elevator.at_floor()
 * Returns undefined if it is moving and returns the floor if it is waiting.
 * - Destination floor
 * elevator.get_destination_floor()
 * The floor the elevator is moving toward.
 * - Position
 * elevator.get_position()
 * Position of the elevator in y-axis. Not necessarily an integer.
 * - Elevator people
 * elevator.get_people()
 * Array of people inside the elevator
 * 
 * 3. Person object
 * - Floor
 * person.get_floor()
 * - Destination
 * person.get_destination_floor()
 * - Get time waiting for an elevator
 * person.get_wait_time_out_elevator()
 * - Get time waiting in an elevator
 * person.get_wait_time_in_elevator()
 * 
 * 4. Time counter
 * Simulator.get_instance().get_time_counter()
 * An integer increasing by 1 on every simulation iteration
 * 
 * 5. Building
 * Simulator.get_instance().get_building()
 * - Number of floors
 * building.get_num_floors()
 */

// create custom array function that used to select all elements that have greater value than at_floor parameter
Array.prototype.greater = function (at_floor) {
    var result = this.filter(function (value) {
        return value >= at_floor;
    });
    return result;
}

// create custom array function that used to select all elements that have smaller value than at_floor parameter
Array.prototype.smaller = function (at_floor) {
    var result = this.filter(function (value) {
        return value <= at_floor;
    });
    return result;
}

Elevator.prototype.decide = function() {
    /* 
    since javascript sort method will sort alphabetically 
    ex : [1, 5, 10, 100] will become [1, 10, 100, 5]

    then we need to define our custom sort function
    so the sort can sort number properly
    */
    function ascending(a, b) {
        return a - b;
    }

    function descending(a, b) {
        return b - a;
    }

    var simulator = Simulator.get_instance();
    var building = simulator.get_building();
    var num_floors = building.get_num_floors();
    var elevators = Simulator.get_instance().get_building().get_elevator_system().get_elevators();
    var time_counter = simulator.get_time_counter();
    var requests = simulator.get_requests();
    
    var elevator = this;
    var people = this.get_people();
    
    if(elevator) {
        elevator.at_floor();
        elevator.get_destination_floor();
        elevator.get_position();
    }
    
    /*
    we dont know the destination of people that requested the lift (yes we know they stay at what floor but we dont know their destination floor until we pick them up) then we will move the elevator one direction only

    I mean by one direction only is that the elevator will go up to the highest floor that has requested for elevator and then after that the elevator will go down to the lowest floor that requested for elevator (vice versa if the elevator move to lowest floor first)
    */
    var direction = this.direction;

    /* 
    requests from all floor and people destination floor in elevator that at the end will be sorted according elevator direction
    */
    var all_requests = [];

    // if there are people in the elevator then push their destination floors first to all_requests
    for (var i = 0; i < people.length; i++) {
        all_requests.push(people[i].get_destination_floor());
    }

    /*
    because at_floor() function will return undefined if the elevator is moving 
    so we need to search manually the current position of the elevator
    */
    var at_floor = (this.get_position() / this.get_height()) + 1;
    
    for(var i = 0;i < requests.length;i++) {
        var handled = false;
        for(var j = 0;j < elevators.length;j++) {
            if(elevators[j].get_destination_floor() == requests[i]) {
                handled = true;
                break;
            }
        }
        if(!handled) {
            all_requests.push(requests[i]);
        }
    }

    var destination_floor;
    // first time movement after idle
    if (!this.direction) {
        // search requests from both direction
        var upper_floor = all_requests.greater(at_floor);
        var lower_floor = all_requests.smaller(at_floor);

        // set destination_floor = upper_floor if upper_floor is same or bigger than lower_floor else set lower_floor
        destination_floor = upper_floor >= lower_floor ? upper_floor : lower_floor;
        // set direction = up if upper_floor is same or bigger than lower_floor else set upper_floor
        this.direction = upper_floor >= lower_floor ? Elevator.DIRECTION_UP : Elevator.DIRECTION_DOWN;
    } else {
        switch (this.direction) {
            case Elevator.DIRECTION_UP:
                // search requests from upper floor
                destination_floor = all_requests.greater(at_floor);

                // if there are no requests from upper floor
                // then search requests from lower floor
                if (destination_floor.length == 0) {
                    destination_floor = all_requests.smaller(at_floor);
                    // set direction to go down
                    this.direction = Elevator.DIRECTION_DOWN;
                }
            break;

            case Elevator.DIRECTION_DOWN:
                // search requests from lower floor
                destination_floor = all_requests.smaller(at_floor);

                // if there are no requests from lower floor
                // then search requests from upper floor
                if (destination_floor.length == 0) {
                    destination_floor = all_requests.greater(at_floor);
                    // set direction to go up
                    this.direction = Elevator.DIRECTION_UP;
                }
            break;
        }
    }

    if (destination_floor.length > 0) {
        // sort destination_floor based on direction
        var sort = this.direction == Elevator.DIRECTION_DOWN ? descending : ascending;
        destination_floor.sort(sort);

        // finally tell the elevator where to go
        return this.commit_decision(destination_floor[0]);
    }
};
