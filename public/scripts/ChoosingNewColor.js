let colors = {
    red: 171,
    green: 250,
    blue: 230,
}

rgbColor = "rgb(" + colors.red + ", " + colors.green + ", " + colors.blue + ")"

ProcessColor(rgbColor)

function UpdateColor(_slider){
    if(_slider.id == "redSlider"){
        colors.red = _slider.value
    }
    else if(_slider.id == "greenSlider"){
        colors.green = _slider.value
    }
    else if(_slider.id == "blueSlider"){
        colors.blue = _slider.value
    }
    rgbColor = "rgb(" + colors.red + ", " + colors.green + ", " + colors.blue + ")"
    ProcessColor(rgbColor)
}


function ProcessColor(_color){
    document.getElementById("colorViewer").style.backgroundColor = _color
    document.getElementById("courseColorInput").value = _color
}