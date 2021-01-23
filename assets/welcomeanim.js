grid_size = 6;
// Positions relative to a grid
curve_point_letters = {
  "outer_c": {
    "param_position": 1.25,
    "end": 2*Math.PI - 1.25,
    "equation": s => [(5*Math.cos(s) + 35)*grid_size, (7.5*Math.sin(s) + 8) * grid_size]
  },
  "inner_c": {
    "param_position": 1,
    "end": 2*Math.PI - 1,
    "equation": s => [(2.5*Math.cos(s) + 35)*grid_size, (-4*Math.sin(s) + 8)*grid_size]
  },
  "outer_o": {
    "param_position": 0,
    "end": 2*Math.PI + .25,
    "equation": s => [(5*Math.cos(s) + 44)*grid_size, (-7*Math.sin(s) + 8) * grid_size]
  },
  "inner_o": {
    "param_position": 0,
    "end": 2*Math.PI + .25,
    "equation": s => [(2.5*Math.cos(s) + 44)*grid_size, (4*Math.sin(s) + 8)*grid_size]
  }
}
straight_point_letters = {
  "W": {
    "points": [[13, 0.5], [11, 15], [8, 15], [7, 7], [6, 15], [3, 15], [0.5, 0.5], [3, 0], [4.5, 8], [6, 0], [8, 0], [9.25, 8], [10.5, 0], [13, 0.5]]
  },
  "E1": {
    "points": [[14.5, 0.5], [14.5, 15], [20.5, 15], [20.5, 13], [17, 13], [17, 9], [20, 9], [20, 7], [17, 7], [17, 2.5], [20.5, 2.5], [20.5, 0.5], [14.5, 0.5]]
  },
  "L": {
    "points": [[25, 13], [29, 13], [29, 15], [23, 15], [23, 0.5], [25, 0.5], [25, 13]]
  },
  "c_seg_1": {
    "points": []
  },
  "c_seg_2": {
    "points": []
  },
  "E2": {
    "points": [[65.5, 0.5], [65.5, 15], [71.5, 15], [71.5, 13], [68, 13], [68, 9], [71, 9], [71, 7], [68, 7], [68, 2.5], [71.5, 2.5], [71.5, 0.5], [65.5, 0.5]]
  },
  "M": {
    "points": [[63, 14.5], [61, 0], [58, 0], [57, 8], [56, 0], [53, 0], [50.5, 14.5], [53, 15], [54.5, 8], [56, 15], [58, 15], [59.25, 7], [60.5, 15], [63, 14.5]]
  },
}
// Connects the end points of the inner and outer curves
straight_point_letters["c_seg_1"]["points"] = [
  (curve_point_letters["outer_c"]["equation"])(curve_point_letters["outer_c"]["param_position"]).map(pos => pos / grid_size),
  (curve_point_letters["inner_c"]["equation"])(curve_point_letters["inner_c"]["end"]).map(pos => pos / grid_size)
];
straight_point_letters["c_seg_2"]["points"] = [
  (curve_point_letters["outer_c"]["equation"])(curve_point_letters["outer_c"]["end"]).map(pos => pos / grid_size),
  (curve_point_letters["inner_c"]["equation"])(curve_point_letters["inner_c"]["param_position"]).map(pos => pos / grid_size)
];

// Determines the normal between consecutive points
set_direction = entry => {
  const cur_index = entry["cur_index"];
  const len = entry["points"].length;
  const diff = [entry["points"][cur_index + 1][0] - entry["points"][cur_index][0], entry["points"][cur_index + 1][1] - entry["points"][cur_index][1]];
  
  const mag = Math.sqrt(diff[0]*diff[0] + diff[1]*diff[1]);
  diff[0] /= mag;
  diff[1] /= mag;
  entry["direction"] = diff;
};
// Convert grid points to pixel locations and sets initial values
Object.values(straight_point_letters).forEach(entry => {
  entry["points"].forEach(point => {
    point[0] *= grid_size;
    point[1] *= grid_size;
  });
  entry["cur_index"] = 0;
  entry["cur_pos"] = entry["points"][0];
  set_direction(entry);
});

// Speed attributes for animation
acceleration = 3;
velocity = 2.5
speed_function = t => {
  if (t < 0.5) {
    return velocity*t + 0.5*acceleration*t*t;
  } else {
    return (acceleration * 0.5 + velocity)*t;
  }
}
// Drawing
//pixels
const offset = [0, 5];
const canvas = document.getElementById("welcome");
const ctx = canvas.getContext('2d');
ctx.lineWidth = 2;
ctx.strokeStyle = '#5E4C5A';

const time_delta = 1/60;
let time = 0;

function draw_straight_letters() {
  Object.entries(straight_point_letters).forEach(pair => {
    ctx.beginPath();
    
    // Less code clutter
    const [key, entry] = pair;
    const cur_pos = [entry["cur_pos"][0], entry["cur_pos"][1]];
    const direction = entry["direction"];
    const next_point = entry["points"][entry["cur_index"] + 1];
    let finished_letter = false;
    
    // Takes a deltaPos step in direction
    let to_point = [cur_pos[0] + speed_function(time)*direction[0], cur_pos[1] + speed_function(time)*direction[1]];
    
    // We overshot the point i.e. finished this segment
    if (  (direction[0] < 0 && to_point[0] < next_point[0]) || 
          (direction[0] > 0 && to_point[0] > next_point[0]) ||
          (direction[1] < 0 && to_point[1] < next_point[1]) || 
          (direction[1] > 0 && to_point[1] > next_point[1]) ) {
      entry["cur_index"] += 1;
      to_point = next_point;
      
      // Last point is solely for determining direction
      if (entry["cur_index"] === entry["points"].length - 1) {
        finished_letter = true;
      } else {
        entry["cur_pos"] = [next_point[0], next_point[1]];
        set_direction(entry);
      }
    }
    
    ctx.moveTo(cur_pos[0] + offset[0], cur_pos[1] + offset[1]);
    ctx.lineTo(to_point[0] + offset[0], to_point[1] + offset[1]);
    ctx.stroke();
    entry["cur_pos"] = to_point;
    
    if (finished_letter) {
      delete straight_point_letters[key];
      return;
    }
  });
}
function draw_curves() {
  Object.entries(curve_point_letters).forEach(pair => {
    ctx.beginPath();
    
    const [key, entry] = pair;
    let s = entry["param_position"];
    const cur_point = entry["equation"](s);
    
    // Dampen the parameter delta
    s += speed_function(time)/60;
    if ( s > entry["end"] ) {
      s = entry["end"];
    }
    
    const to_point = entry["equation"](s);
    
    ctx.moveTo(cur_point[0] + offset[0], cur_point[1] + offset[1]);
    ctx.lineTo(to_point[0] + offset[0], to_point[1] + offset[1]);
    ctx.stroke();
    if (s >= entry["end"]) {
      delete curve_point_letters[key]
      return;
    }
    entry["param_position"] = s;
  });
}
// Main logic
function draw() {
  draw_straight_letters();
  draw_curves();
  time += time_delta;
  if (time < 3) {
    window.requestAnimationFrame(draw);
  }
}
draw();
