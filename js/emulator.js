var snake;
var headx;
var heady;
var length;
var goalx;
var goaly;
var pix;
var direction;
var timeout = 70;
var timeout = 70;

self.onmessage = function(event){
    if(event.data == "start"){
        start();
    }
    else if(event.data == "rendered"){
    }
    else if(event.data == 'w'){
        direction = 0;
    }
    else if(event.data == 'a'){
        direction = 1;
    }
    else if(event.data == 's'){
        direction = 2;
    }
    else if(event.data == 'd'){
        direction = 3;
    }
}

function move(){
    if( direction == 0 ){
        if( heady > 0 ){
            heady--;
        }
        else{
            end();
        }
    }
    else if( direction == 1 ){
        if( headx > 0 ){
            headx--;
        }
        else{
            end();
        }
    }
    else if( direction == 2 ){
        if( heady < 99 ){
            heady++;
        }
        else{
            end();
        }
    }
    else if( direction == 3 ){
        if( headx < 99 ){
            headx++;
        }
        else{
            end();
        }
    }

    detectEating();

    setTimeout(detectColision, 1000);

    snake.push({"x": headx, "y": heady});
    
    if( length < snake.length ){
        snake.splice(0,1);
    }
    display();
    setTimeout( move, timeout );
}

function detectColision(){
    for( i = 0; i < snake.length - 1; i++ ){
        if( headx == snake[i].x && heady == snake[i].y ){
            end();
        }
    }
}

function detectEating(){
    if( headx == goalx && heady == goaly ){
        newGoal();
        length++;
    }
}

function overlap(){
    for( i = 0; i < snake.length; i++ ){
        if( goalx == snake[i].x && goaly == snake[i].y ){
            return true;
        }
    }
    return false;
}

function newGoal(){
    goalx = Math.floor(Math.random()*100);
    goaly = Math.floor(Math.random()*100);
    while( overlap() ){
        goalx = Math.floor(Math.random()*100);
        goaly = Math.floor(Math.random()*100);
    }
}

function end(){
    self.postMessage("end");
    self.close();
}

function start(){
    headx = 50;
    heady = 50;
    length = 1;
    snake = new Array();
    snake.push({"x": 50, "y": 50});
    newGoal();
    direction = 0;
    display();
    setTimeout( move, 70 );
}

function display(){
    pix = new Array();
    for( i = 0; i < snake.length; i++ ){
        pix.push({"x": snake[i].x, "y": snake[i].y, "r": 0, "g": 0, "b": 255, "a": 200});
    }
    pix.push({"x": goalx, "y": goaly, "r": 0, "g": 255, "b": 0, "a": 200});
    self.postMessage( {"data": pix});
}
