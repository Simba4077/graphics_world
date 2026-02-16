class Camera{
    constructor(){
        this.eye = new Vector3([-13,0.75,-12]);
        this.at = new Vector3([-13,0.75,-100]);
        this.up = new Vector3([0,1,0]);
        this.groundLevel = 0.75;
    }

    forward(){
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        if(!g_flyMode){
            f.elements[1] = 0;
        }
        f.normalize();
        
        var newEye = new Vector3();
        newEye.set(this.eye);
        newEye.add(f);
        
        var newAt = new Vector3();
        newAt.set(this.at);
        newAt.add(f);
        
        // Check collision before moving
        if(checkCollision(newEye.elements[0], newEye.elements[2])) {
            return; // Don't move if there's a wall
        }
        
        if (newEye.elements[1] >= this.groundLevel) {
            this.eye = newEye;
            this.at = newAt;
        } else {
            var yDiff = this.eye.elements[1] - newEye.elements[1];
            this.eye.elements[1] = this.groundLevel;
            this.at.elements[1] += yDiff;
        }
    }

    back(){
        var b = new Vector3();
        b.set(this.eye);
        b.sub(this.at);
        if(!g_flyMode){
            b.elements[1] = 0;
        }
        b.normalize();
        
        var newEye = new Vector3();
        newEye.set(this.eye);
        newEye.add(b);
        
        var newAt = new Vector3();
        newAt.set(this.at);
        newAt.add(b);
        
        // Check collision
        if(checkCollision(newEye.elements[0], newEye.elements[2])) {
            return;
        }
        
        if (newEye.elements[1] >= this.groundLevel) {
            this.eye = newEye;
            this.at = newAt;
        } else {
            var yDiff = this.eye.elements[1] - newEye.elements[1];
            this.eye.elements[1] = this.groundLevel;
            this.at.elements[1] += yDiff;
        }
    }

    left(){
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        var s = Vector3.cross(this.up, f);
        if(!g_flyMode){
            s.elements[1] = 0;
        }
        s.normalize();
        
        var newEye = new Vector3();
        newEye.set(this.eye);
        newEye.add(s);
        
        var newAt = new Vector3();
        newAt.set(this.at);
        newAt.add(s);
        
        // Check collision
        if(checkCollision(newEye.elements[0], newEye.elements[2])) {
            return;
        }
        
        if (newEye.elements[1] >= this.groundLevel) {
            this.eye = newEye;
            this.at = newAt;
        } else {
            var yDiff = this.eye.elements[1] - newEye.elements[1];
            this.eye.elements[1] = this.groundLevel;
            this.at.elements[1] += yDiff;
        }
    }

    right(){
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        var s = Vector3.cross(f, this.up);
        if(!g_flyMode){
            s.elements[1] = 0;
        }
        s.normalize();
        
        var newEye = new Vector3();
        newEye.set(this.eye);
        newEye.add(s);
        
        var newAt = new Vector3();
        newAt.set(this.at);
        newAt.add(s);
        
        // Check collision
        if(checkCollision(newEye.elements[0], newEye.elements[2])) {
            return;
        }
        
        if (newEye.elements[1] >= this.groundLevel) {
            this.eye = newEye;
            this.at = newAt;
        } else {
            var yDiff = this.eye.elements[1] - newEye.elements[1];
            this.eye.elements[1] = this.groundLevel;
            this.at.elements[1] += yDiff;
        }
    }

    panLeft(){
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        var alpha = 5;
        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var f_prime = rotationMatrix.multiplyVector3(f);
        this.at = new Vector3();
        this.at.set(this.eye);
        this.at.add(f_prime);
    }

    panRight(){
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        var alpha = -5;
        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var f_prime = rotationMatrix.multiplyVector3(f);
        this.at = new Vector3();
        this.at.set(this.eye);
        this.at.add(f_prime);
    }
}


function checkCollision(worldX, worldZ) {
    var mapX = Math.floor(worldX + 16);
    var mapZ = Math.floor(worldZ + 16);
    
    // Check bounds
    if(mapX < 0 || mapX >= g_map[0].length || mapZ < 0 || mapZ >= g_map.length) {
        return true; // Out of bounds = collision
    }
    
    // Check if there's a wall
    if(g_map[mapZ][mapX] > 0) {
        return true; // Wall present = collision
    }
    
    return false; // No collision
}