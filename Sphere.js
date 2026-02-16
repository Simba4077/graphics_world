class Sphere{
  constructor(segments=30){
    this.type='sphere';
    this.color=[1.0,1.0,1.0,1.0];
    this.matrix = new Matrix4(); //uncomment when using 
    this.textureNum = -1; //use UV color as default
    var vertices = [];
    var uvs = [];
    
    // Generate sphere vertices using spherical coordinates
    for (var lat = 0; lat <= segments; lat++) {
      var theta = lat * Math.PI / segments; // 0 to PI
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);
      
      for (var lon = 0; lon <= segments; lon++) {
        var phi = lon * 2 * Math.PI / segments; // 0 to 2PI
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);
        
        // Vertex position (unit sphere)
        var x = cosPhi * sinTheta;
        var y = cosTheta;
        var z = sinPhi * sinTheta;
        
        // UV coordinates
        var u = 1 - (lon / segments);
        var v = 1 - (lat / segments);
        
        vertices.push(x, y, z);
        uvs.push(u, v);
      }
    }
    
    // Generate triangles
    var sphereVerts = [];
    var sphereUVs = [];
    
    for (var lat = 0; lat < segments; lat++) {
      for (var lon = 0; lon < segments; lon++) {
        var first = (lat * (segments + 1)) + lon;
        var second = first + segments + 1;
        
        // First triangle
        sphereVerts.push(
          vertices[first * 3], vertices[first * 3 + 1], vertices[first * 3 + 2],
          vertices[second * 3], vertices[second * 3 + 1], vertices[second * 3 + 2],
          vertices[(first + 1) * 3], vertices[(first + 1) * 3 + 1], vertices[(first + 1) * 3 + 2]
        );
        sphereUVs.push(
          uvs[first * 2], uvs[first * 2 + 1],
          uvs[second * 2], uvs[second * 2 + 1],
          uvs[(first + 1) * 2], uvs[(first + 1) * 2 + 1]
        );
        
        // Second triangle
        sphereVerts.push(
          vertices[second * 3], vertices[second * 3 + 1], vertices[second * 3 + 2],
          vertices[(second + 1) * 3], vertices[(second + 1) * 3 + 1], vertices[(second + 1) * 3 + 2],
          vertices[(first + 1) * 3], vertices[(first + 1) * 3 + 1], vertices[(first + 1) * 3 + 2]
        );
        sphereUVs.push(
          uvs[second * 2], uvs[second * 2 + 1],
          uvs[(second + 1) * 2], uvs[(second + 1) * 2 + 1],
          uvs[(first + 1) * 2], uvs[(first + 1) * 2 + 1]
        );
      }
    }
    
    this.sphereVerts = new Float32Array(sphereVerts);
    this.sphereUVs = new Float32Array(sphereUVs);
    this.vertexCount = sphereVerts.length / 3;
  }

renderfast(){
    var rgba = this.color;
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
    if(g_vertexBuffer == null){
      initTriangle3D();
    }

    // Bind vertex buffer and upload vertex data
    gl.bufferData(gl.ARRAY_BUFFER, this.sphereVerts, gl.DYNAMIC_DRAW);
    
    if(g_uvBuffer == null){
      initUVBuffer();
    }


    // Bind UV buffer and upload UV data
    gl.bufferData(gl.ARRAY_BUFFER, this.sphereUVs, gl.DYNAMIC_DRAW);
    
    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
}

} 

