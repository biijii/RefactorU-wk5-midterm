// *********************************************************************
//     BLOCK
// *********************************************************************
var Block = function(blockSizing, relx, rely, blockColor) {
  this.dimension = blockSizing;
  this.relx = relx;
  this.rely = rely;

  this.blockColor = blockColor;
};

Block.prototype.setRelPos = function(coords){
  this.relx = coords[0];
  this.rely = coords[1];
  return this;
}

Block.prototype.setColor = function(theColor){
 this.blockColor = theColor;
 return this;
}

Block.prototype.render = function(){
  var that=this;

  if (this.$el === undefined) { 
    this.$el = $("<div>").css("position","absolute")
                         .css("width",that.dimension)
                         .css("height",that.dimension);
  }

  this.$el.addClass("block").css("top",that.rely*that.dimension + "px")
                            .css("left",that.relx*that.dimension + "px");

  this.$el.css("background",this.blockColor);

  return this.$el;
};

// *********************************************************************
//     PIECE
// *********************************************************************
var Piece = function(blockSizing, posx, posy) {
  this.blockSizing = blockSizing;

  this.posx = posx;
  this.posy = posy;

  this.blocks = [new Block(blockSizing),
                 new Block(blockSizing),
                 new Block(blockSizing),
                 new Block(blockSizing),
                ];

  this.rotations = []; // rotations[0] = default view
  this.rotation; // Currently used rotation

  this.dimensionX;
  this.dimensionY;

  this.lastMove;
};

Piece.prototype.getCoords = function(){
  var that = this;
  return _.map(this.blocks, function(aBlock){
    return [that.posx + aBlock.relx, that.posy + aBlock.rely];
  });
}

Piece.prototype.setBlockSizing = function(blockSizing){
  this.blockSizing = blockSizing;

  var that=this;
  _.map(that.blocks, function(aBlock){
    aBlock.dimension = blockSizing;
  });

  return this;
}

Piece.prototype.setRotation = function(whichRotation){
  this.rotation = whichRotation;

  for(var i=0; i < this.blocks.length; i++){
    this.blocks[i].setRelPos(this.rotations[this.rotation][i]);
  }

  return this;
}

Piece.prototype.toggleRotation = function(){
  var newRotation = (this.rotation === this.rotations.length-1) ? 0 : this.rotation + 1;
  this.setRotation(newRotation);
  return this;
}

Piece.prototype.defineRotations = function(templateArray){
  var that = this;
  this.rotations = _.map(templateArray, function(aTemplate){
    return that.parseTemplate(aTemplate);
  })

  return this;
}

Piece.prototype.parseTemplate = function(singleTemplate){
  var coords = [];
  for (var row=0; row < singleTemplate.length; row++){
    for (var col=0; col < singleTemplate[row].length; col++){
        var datum = singleTemplate[row][col];
        if (datum) { coords[datum-1] = [col,row]; } // 'Backwards,' but correct.
    }
    if (this.dimensionX === undefined) { this.dimensionX = col; }
  }
  if (this.dimensionY === undefined) { this.dimensionY = row; }
  return coords;
}

Piece.prototype.parseBinaryTemplate = function(binaryTemplate){
  // console.log("Parsing binary template.");
  this.blocks = [];

  for (var row=0; row < binaryTemplate.length; row++){
    for (var col=0; col < binaryTemplate[row].length; col++){
        var datum = binaryTemplate[row][col];
        if (datum) { this.blocks.push(new Block(this.blockSizing,col,row)); } // 'Backwards,' but correct.
    }
    if (this.dimensionX === undefined) { this.dimensionX = col; }
  }
  if (this.dimensionY === undefined) { this.dimensionY = row; }

  return this;
}

Piece.prototype.computeMove = function(moveDirection){
  var that = this;
  switch(moveDirection){
    case "down": // inc y
      this.provisionalPos = [this.posx,this.posy+1];
      break;
    case "left": // dec x
      this.provisionalPos = [this.posx-1,this.posy];
      break;
    case "right": // inc x
      this.provisionalPos = [this.posx+1,this.posy];
      break;
    case "up": // ROTATE
      // console.log("ROTATE");
      this.provisionalPos = [this.posx,this.posy];
      break;
    default:
      console.log("ERROR: Invalid direction");
      return false;
  }

  this.lastMove = moveDirection;

  if (moveDirection === "up"){
    // COMPUTE ROTATION
    var nextRotationDex = (this.rotation+1 === this.rotations.length) ? 0 : this.rotation+1;
    var nextRotationRels = this.rotations[nextRotationDex];

    this.provisionalCoords = _.map(nextRotationRels, function(aRel){
      return [that.provisionalPos[0]+aRel[0], that.provisionalPos[1]+aRel[1]];
    });
  }
  else {
    this.provisionalCoords = _.map(that.blocks, function(aBlock){
      return [that.provisionalPos[0]+aBlock.relx, that.provisionalPos[1]+aBlock.rely];
    });
  }

  return this.provisionalCoords;
};

Piece.prototype.commitLastMove = function(){
  // for (var i=0; i < this.provisionalCoords.length; i++){
  //   this.blocks[i].posx = this.provisionalCoords[i][0];
  //   this.blocks[i].posy = this.provisionalCoords[i][1];
  // }
  this.posx = this.provisionalPos[0];
  this.posy = this.provisionalPos[1];

  if (this.lastMove === "up"){ this.toggleRotation(); }
                                 
  this.provisionalCoords = [], this.provisionalPos = undefined, this.lastMove = undefined;

  return this;
};

Piece.prototype.setColor = function(theColor){
  var that = this;

  if ( theColor === undefined ){
    var randomRedVal = Math.round(Math.random()*255);
    var randomGreenVal = Math.round(Math.random()*255);
    var randomBlueVal = Math.round(Math.random()*255);

    this.blockColor = "rgb(" + [randomRedVal, randomGreenVal, randomBlueVal].join(",") + ")";
  }
  else {
    this.blockColor = theColor;
  }

  _.map(this.blocks, function(aBlock){
    aBlock.setColor(that.blockColor);
  });

  return this;
}

Piece.prototype.getColor = function(){
  return this.blockColor;
}

Piece.prototype.render = function(){
  var that=this;
  if (this.$el === undefined){ 
    this.$el = $("<div>").css("position","absolute")
                         .css("width",that.dimensionX*that.blockSizing + "px")
                         .css("height",that.dimensionY*that.blockSizing + "px");
  }
  // else { this.$el.text(""); }

  this.$el.addClass("piece").css("top",that.posy*that.blockSizing + "px")
                            .css("left",that.posx*that.blockSizing + "px");

  _.map(that.blocks, function(aBlock){
    that.$el.append(aBlock.render());
  });

  return this.$el;
};

// Rod
// ***************************************************
var Rod = function(blockSizing){
  var template = [];
  template[0] = [[0,0,1,0],
                 [0,0,2,0],
                 [0,0,3,0],
                 [0,0,4,0]];

  template[1] = [[0,0,0,0],
                 [4,3,2,1],
                 [0,0,0,0],
                 [0,0,0,0]];

  template[2] = [[0,0,4,0],
                 [0,0,3,0],
                 [0,0,2,0],
                 [0,0,1,0]];

  template[3] = [[0,0,0,0],
                 [1,2,3,4],
                 [0,0,0,0],
                 [0,0,0,0]];

  this.defineRotations(template);
  this.setBlockSizing(blockSizing);
}

Rod.prototype = new Piece;
Rod.prototype.constructor = Rod;

// Square
// ***************************************************
var Square = function(blockSizing){
  // Piece.call(this,blockSizing);

  var template = [];
  template[0] = [[1,2],
                 [3,4]];
  
  template[1] = [[3,1],
                 [4,2]];
 
  template[2] = [[4,3],
                 [2,1]];
  
  template[3] = [[2,4],
                 [1,3]];

  this.defineRotations(template);
  this.setBlockSizing(blockSizing);
}

Square.prototype = new Piece;
Square.prototype.constructor = Square;

// RightS
// ***************************************************
var RightS = function(blockSizing){
  var template = [];
  template[0] = [[0,0,1],
                 [0,2,3],
                 [0,4,0]];

  template[1] = [[0,0,0],
                 [4,2,0],
                 [0,3,1]];

  template[2] = [[0,0,4],
                 [0,3,2],
                 [0,1,0]];

  template[3] = [[0,0,0],
                 [1,3,0],
                 [0,2,4]];

  this.defineRotations(template);
  this.setBlockSizing(blockSizing);
}

RightS.prototype = new Piece;
RightS.prototype.constructor = RightS;

// LeftS
// ***************************************************
var LeftS = function(blockSizing){
  var template = [];

  template[0] = [[0,1,0],
                 [0,2,3],
                 [0,0,4]];

  template[1] = [[0,0,0],
                 [0,2,1],
                 [4,3,0]];

  template[2] = [[0,4,0],
                 [0,3,2],
                 [0,0,1]];

  template[3] = [[0,0,0],
                 [0,3,4],
                 [1,2,0]];

  this.defineRotations(template);
  this.setBlockSizing(blockSizing);
}

LeftS.prototype = new Piece;
LeftS.prototype.constructor = LeftS;
// ThreeSide
// ***************************************************
var ThreeSide = function(blockSizing){
  var template = [];
  template[0] = [[0,1,0],
                 [2,3,4],
                 [0,0,0]];

  template[1] = [[0,2,0],
                 [0,3,1],
                 [0,4,0]];

  template[2] = [[0,0,0],
                 [4,3,2],
                 [0,1,0]];

  template[3] = [[0,4,0],
                 [1,3,0],
                 [0,2,0]];

  this.defineRotations(template);
  this.setBlockSizing(blockSizing);
}

ThreeSide.prototype = new Piece;
ThreeSide.prototype.constructor = ThreeSide;
// RightL
// ***************************************************
var RightL = function(blockSizing){
  var template = [];
  template[0] = [[0,1,0],
                 [0,2,0],
                 [0,3,4]];

  template[1] = [[0,0,0],
                 [3,2,1],
                 [4,0,0]];

  template[2] = [[0,4,3],
                 [0,0,2],
                 [0,0,1]];

  template[3] = [[0,0,0],
                 [0,0,4],
                 [1,2,3]];

  this.defineRotations(template);
  this.setBlockSizing(blockSizing);
}

RightL.prototype = new Piece;
RightL.prototype.constructor = RightL;
// LeftL
// ***************************************************
var LeftL = function(blockSizing){
  var template = [];
  template[0] = [[0,0,1],
                 [0,0,2],
                 [0,3,4]];

  template[1] = [[0,0,0],
                 [3,0,0],
                 [4,2,1]];

  template[2] = [[0,4,3],
                 [0,2,0],
                 [0,1,0]];

  template[3] = [[0,0,0],
                 [1,2,4],
                 [0,0,3]];

  this.defineRotations(template);
  this.setBlockSizing(blockSizing);
}

LeftL.prototype = new Piece;
LeftL.prototype.constructor = LeftL;
// *********************************************************************
//     PLAYFIELD
// *********************************************************************
var Playfield = function(blockDimension,widthInBlocks,heightInBlocks){
  this.blockDimension = blockDimension;

  this.fieldWidth = widthInBlocks;
  this.fieldHeight = heightInBlocks;
  this.activePiece;
  this.staticBlocks = [];

  this.bordersWidth = 5; //Width in pixels of playfield border
};

Playfield.prototype.resetPlayfield = function(){
  this.staticBlocks = [];
  return this;
}

Playfield.prototype.simulateCollision = function(coordArray){
  for (var i=0; i < coordArray.length; i++){
    var thisX = coordArray[i][0];
    var thisY = coordArray[i][1];

    //Playfield boundary detection
    if (thisX < 0 || thisX === this.fieldWidth || thisY === this.fieldHeight) { return true; }

    //Static piece collision detection
    // for (var j=0; j < this.staticPieces.length; j++){
    //   for (var k=0; k < this.staticPieces[j].blocks.length; k++){
    //     var staticX = this.staticPieces[j].posx + this.staticPieces[j].blocks[k].relx;
    //     var staticY = this.staticPieces[j].posy + this.staticPieces[j].blocks[k].rely;
    //     if (thisX === staticX && thisY === staticY) { return true; }        
    //   }
    // }

    //Static block collision detection
    for (var j=0; j < this.staticBlocks.length; j++){
      var staticX = this.staticBlocks[j].relx;
      var staticY = this.staticBlocks[j].rely;
      if (thisX === staticX && thisY === staticY) { return true; }        
    }

  }
  return false;
};

Playfield.prototype.moveActivePiece = function(moveDirection){
  var simulatedMove = this.activePiece.computeMove(moveDirection);
  var isCollision = this.simulateCollision(simulatedMove);

  if (!isCollision) { this.activePiece.commitLastMove().render(); } // Move piece and render it

  return !isCollision;
};

Playfield.prototype.setActivePiece = function(pieceObj){
  this.activePiece = pieceObj;
  this.activePiece.posx = Math.round((this.fieldWidth/2)-(this.activePiece.dimensionX/2));
  this.activePiece.posy = 0;
  return this;
}

Playfield.prototype.retireActivePiece = function(){
  var retiredBlocks = this.activePiece.blocks;
  var retiredColor = this.activePiece.getColor();
  var that = this;
  // _.map(retiredBlocks, function(retiredBlock){
  //   retiredBlock.relx += that.activePiece.posx;
  //   retiredBlock.rely += that.activePiece.posy;
  // });
  // this.staticBlocks = this.staticBlocks.concat(retiredBlocks);

  var staticBlocks = _.map(retiredBlocks, function(retiredBlock){
    var xpos = retiredBlock.relx + that.activePiece.posx;
    var ypos = retiredBlock.rely + that.activePiece.posy;
    return new Block(that.blockDimension,xpos,ypos,retiredColor);
  });

  this.staticBlocks = this.staticBlocks.concat(staticBlocks);

  this.activePiece = undefined;
  return this;
}

Playfield.prototype.clearLines = function(){
  var that=this;
  var clearedLines = 0;

  for (var i=this.fieldHeight-1; i >= 0; i--){
    var blocks = _.where(this.staticBlocks, {rely: i});
    var blockCount = blocks.length;
    // console.log("Line " + i + ": ", blockCount);

    if (blockCount === 0) { break; }
    else if (blockCount === this.fieldWidth){
      while (blockCount === this.fieldWidth){
        // console.log("CLEAR LINE");
        clearedLines++;

        _.map(blocks, function(aBlock) {
          that.staticBlocks.splice(that.staticBlocks.indexOf(aBlock),1); // Remove block from static blocks
        });

        // Can't move all other blocks down ---> need to find blocks above line (smaller y vals)
        _.map(this.staticBlocks, function(aBlock){
          if (aBlock.rely < i) aBlock.rely++;
        });

        blocks = _.where(this.staticBlocks, {rely: i});
        blockCount = blocks.length;
      }
    }
  }

  return clearedLines;
}

Playfield.prototype.render = function(){
  if (this.$el === undefined) {
    this.$el = $("<div>").addClass("playfield")
                         .css("position","relative")
                         .css("width",this.fieldWidth*this.blockDimension+(2*this.bordersWidth))
                         .css("height",this.fieldHeight*this.blockDimension+(2*this.bordersWidth));
  }
  else { this.$el.text(""); }

  // console.log("Rendering playfield");

  for(var i=0; i<this.staticBlocks.length; i++){
    this.$el.append(this.staticBlocks[i].render());
  }  

  if (this.activePiece) { this.$el.append(this.activePiece.render().addClass("active-piece")); }

  return this.$el;
};

// *********************************************************************
//     GAME (WHOLE SHEBANG)
// *********************************************************************
var Game = function(blockSizing, playFieldDimensions,pieceFrequencies){
  this.playfield = new Playfield(blockSizing,playFieldDimensions[0],playFieldDimensions[1]);
  this.blockSizing = blockSizing;

  this.state = "paused";
  // this.deusSpeed = 500;
  this.deusTimer;

  this.nextPiece;
  // this.clearedLinesTotal = 0;
  // this.clearedLinesLevel = 0;
  // this.score = 0;
  // this.level = 1;

  this.pointsPerBlock = 10;
  this.linesPerLevel = 10;

  this.speedIncreasePerLevel = 0.10; // Speed will increase ten percent each time

  // Piece frequencies
  // [0] rod
  // [1] square
  // [2] rightS
  // [3] leftS
  // [4] threeSide
  // [5] leftL
  // [6] rightL
  this.pieceSelectionCutoffs = [];

  var minVal = 0;
  for(var i=0; i < pieceFrequencies.length; i++){
    this.pieceSelectionCutoffs.push(minVal + pieceFrequencies[i]);
    minVal += pieceFrequencies[i];
  }

  this.logo;
}

Game.prototype.newGame = function(){
  this.state = "paused";

  this.deusSpeed = 500;

  this.clearedLinesTotal = 0;
  this.clearedLinesLevel = 0;
  this.score = 0;
  this.level = 1;

  this.playfield.resetPlayfield().setActivePiece(this.generateNewPiece());
  this.nextPiece = this.generateNewPiece();
  this.render();

  $("#pausedModal").modal({"backdrop" : "static", "keyboard" : false});
}

Game.prototype.toggleState = function(){
  var that = this;

  switch(this.state){
    case "paused":
      this.state = "running";
      this.deusTimer = setInterval( function(){ that.move("down"); }, this.deusSpeed);
      break;
    case "running":
      this.state = "paused";
      clearInterval(this.deusTimer);
      break;
    default:
      console.log("Oops...game pause/run error");
  }
}

Game.prototype.generateNewPiece = function(){
  var randomVal = Math.random();

  var newPiece;

  var that = this;

  if (randomVal < this.pieceSelectionCutoffs[0]) { newPiece = new Rod(that.blockSizing); }
  else if (randomVal < this.pieceSelectionCutoffs[1]) { newPiece = new Square(that.blockSizing); }
  else if (randomVal < this.pieceSelectionCutoffs[2]) { newPiece = new RightS(that.blockSizing); }
  else if (randomVal < this.pieceSelectionCutoffs[3]) { newPiece = new LeftS(that.blockSizing); }
  else if (randomVal < this.pieceSelectionCutoffs[4]) { newPiece = new ThreeSide(that.blockSizing); }
  else if (randomVal < this.pieceSelectionCutoffs[5]) { newPiece = new LeftL(that.blockSizing); }
  else {newPiece = new RightL(that.blockSizing); }

  newPiece.setRotation(0);

  newPiece.setColor();

  return newPiece;
}

Game.prototype.move = function(moveDirection){
  if (!this.playfield.moveActivePiece(moveDirection)){
    // This means that this.playfield.moveActivePiece(...) returned false --> COLLISION

    if (moveDirection === "down"){
      // Piece has hit its 'final' location
      // --> Leave the piece where it is, and create a new activePiece
      var newlyClearedLines = this.playfield.retireActivePiece().clearLines();

      // Update lines and score
      this.clearedLinesTotal += newlyClearedLines;
      this.clearedLinesLevel += newlyClearedLines;

      this.score += (this.pointsPerBlock*this.level*4); // Score from dropped piece --> 4 blocks
      this.score += (newlyClearedLines*this.playfield.fieldWidth*this.pointsPerBlock*this.level); // Score from cleared lines

      // Update level
      if (this.clearedLinesLevel >= this.linesPerLevel){
        this.clearedLinesLevel = 0;
        this.level++;

        // Increase speed
        this.toggleState();
        this.deusSpeed *= (1-this.speedIncreasePerLevel);
        console.log("NEW DEUS SPEED: ", this.deusSpeed);
        this.toggleState();

        // Change logo color
        this.logo.setColor().render();
      }

      this.playfield.setActivePiece(this.nextPiece);
      this.nextPiece = this.generateNewPiece();
      this.render();

      // Check to see if newly active piece is already colliding ---> game over
      if (this.playfield.simulateCollision(this.playfield.activePiece.getCoords())){
        // Game over
        console.log("GAME OVER");
        clearInterval(this.deusTimer); // Stop timer
        this.state = "game over"
        $("#gameOverModal").modal({"backdrop" : "static", "keyboard" : false});
      }
    }
  }
  // Else everything OK and piece was already moved
}

Game.prototype.render = function(){
  if (this.$el === undefined) { this.$el = $(".game-container"); }
  else {
    $(".game-logo").text();
    $(".game-playfield-container").text("");
    $(".game-aux-score-data").text("");
    $(".game-aux-level-data").text("");
    $(".game-aux-next-piece-data").text("");
    $(".game-aux-line-count-data").text("");
  }

  $(".game-playfield-container").append(this.playfield.render());

  // Determine height of playfield and set height of aux-container
  var playfieldHeight = (this.playfield.fieldHeight * this.playfield.blockDimension); 
  $(".game-aux-container").css("height",playfieldHeight + "px");

  $(".game-aux-score-data").append(this.score);
  $(".game-aux-next-piece-data").append(this.nextPiece.render());
  $(".game-aux-level-data").append(this.level);
  $(".game-aux-line-count-data").append(this.clearedLinesTotal);

  if (this.logo) {

    $(".game-logo").append(this.logo.render());
  }

  return this.$el;
}

// *********************************************************************
// *********************************************************************
//   DEFINE OBJECTS | DEFINE OBJECTS | DEFINE OBJECTS | DEFINE OBJECTS
// *********************************************************************
// *********************************************************************

var theGame = new Game(25,[15,20],[.04, .13, .19, .19, .19, .13, .13]);

// *********************************************************************
//  --- GAME LOGO ---
// *********************************************************************
var logoTemplate = [[1,1,1,1,1,0,1,1,1,0,0,1,0,0,1,0,0,0,1,0,1,0,1,1,1],
                    [0,0,1,0,0,0,1,0,1,0,0,1,0,0,1,1,1,0,1,0,1,0,0,0,1],
                    [0,0,1,0,0,0,1,1,1,0,1,1,1,0,1,0,0,0,1,0,1,0,0,1,0],
                    [0,0,1,0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,1,0,1,0,1,0,0],
                    [0,0,1,0,0,0,1,1,1,0,0,1,1,0,1,0,0,0,1,1,1,0,1,1,1]];

theGame.logo = new Piece(theGame.blockSizing,0,0);
theGame.logo.parseBinaryTemplate(logoTemplate);
theGame.logo.setColor(); // Random color

// *********************************************************************
// *********************************************************************
//   RUN | RUN | RUN | RUN | RUN  RUN | RUN  RUN | RUN  RUN | RUN  RUN 
// *********************************************************************
// *********************************************************************

$(document).on("ready", function() {
  theGame.newGame();
});

$(document).keydown(function(e) {
  e.preventDefault();

  var maybeMove;

  switch(e.which) {
    case 37: // left
      maybeMove = "left";
      break;
    case 39: // right
      maybeMove = "right";
      break;
    case 40: // down
      maybeMove = "down";
      break;
    case 38: // up
      maybeMove = "up";
      break;
    case 32: // Space bar
      if (theGame.state === "game over"){
        $("#gameOverModal").modal("hide");
        theGame.newGame();

        theGame.toggleState(); // Make game start immediately
        $("#pausedModal").modal("toggle"); // Hide paused modal immediately
      }
      else {
        theGame.toggleState();
        $("#pausedModal").modal("toggle");
      }
      return;
    default:
      console.log("IGNORED USER INPUT");
      return;
  }

  if (theGame.state === "running"){ theGame.move(maybeMove); }
});