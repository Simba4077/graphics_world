class Camera{
    constructor(){
        this.eye = new Vector3([0,0,3]);
        this.at = new Vector3([0,0,-100]);
        this.up = new Vector3([0,1,0]);
    }

    forward(){
        var f = this.at.sub(this.eye);
        f = f.div(f.magnitude());
        this.eye = this.eye.add(f);
        this.at = this.at.add(f);
    }

    back(){
        var f = this.at.sub(this.eye);  // Changed: use at-eye (same direction)
        f = f.div(f.magnitude());
        this.eye = this.eye.sub(f);      // Changed: subtract f
        this.at = this.at.sub(f);        // Changed: subtract f
    }

    left(){
        var f = this.at.sub(this.eye);
        f = f.div(f.magnitude());
        var s = Vector3.cross(f,this.up);  // Changed: up × f
        s = s.div(s.magnitude());
        this.eye = this.eye.add(s);
        this.at = this.at.add(s);
    }

    right(){
        var f = this.at.sub(this.eye);
        f = f.div(f.magnitude());
        var s = Vector3.cross(f,this.up);  // Changed: up × f
        s = new Vector3([-s.elements[0], -s.elements[1], -s.elements[2]]); // Changed: negate s
        s = s.div(s.magnitude());
        this.eye = this.eye.add(s);
        this.at = this.at.add(s);
    }
}