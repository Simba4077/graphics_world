class Camera{
    constructor(){
        this.eye = new Vector3([0,0,3]);
        this.at = new Vector3([0,0,-100]);
        this.up = new Vector3([0,1,0]);
    }

    forward(){
        // f = at - eye
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        // Normalize
        f.normalize();
        // eye += f; at += f;
        this.eye = this.eye.add(f);
        this.at = this.at.add(f);
    }

    back(){
        // b = eye - at (backward vector)
        var b = new Vector3();
        b.set(this.eye);
        b.sub(this.at);
        // Normalize
        b.normalize();
        // eye += b; at += b;
        this.eye = this.eye.add(b);
        this.at = this.at.add(b);
    }

    left(){
        // f = at - eye
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        // s = up × f
        var s = Vector3.cross(this.up, f);
        // Normalize
        s.normalize();
        // eye += s; at += s;
        this.eye = this.eye.add(s);
        this.at = this.at.add(s);
    }

    right(){
        // f = at - eye
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        // s = f × up (opposite of left)
        var s = Vector3.cross(f, this.up);
        // Normalize
        s.normalize();
        // eye += s; at += s;
        this.eye = this.eye.add(s);
        this.at = this.at.add(s);
    }

    panLeft(){
        // f = at - eye
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        // Rotate f by alpha degrees around up vector
        var alpha = 5; // degrees
        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        
        // f_prime = rotationMatrix * f
        var f_prime = rotationMatrix.multiplyVector3(f);
        
        // at = eye + f_prime
        this.at = this.eye.add(f_prime);
    }

    panRight(){
        // f = at - eye
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        // Rotate f by -alpha degrees around up vector
        var alpha = -5; // negative for right
        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        
        // f_prime = rotationMatrix * f
        var f_prime = rotationMatrix.multiplyVector3(f);
        
        // at = eye + f_prime
        this.at = this.eye.add(f_prime);
    }
}