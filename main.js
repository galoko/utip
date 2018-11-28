let scene, sceneElement, activeColorElement, activeBrushSizeElement, lastMousePosition;

function initialize() {
    
    setupScene();
    
    initializeContainer("colors", (element) => 
        { element.onclick = () => setupColor(element); });
        
    initializeContainer("brush_sizes", (element) => 
        { element.onclick = () => setupBrushSizes(element); });
        
    window.addEventListener("storage", handleStorageInput);
    
    loadScene();
}

function setupScene() {
    
    sceneElement = document.getElementById("scene");
    if (!(sceneElement instanceof HTMLCanvasElement))
        throw "Couldn't find a scene element.";
    
    scene = sceneElement.getContext("2d");;
    if (!scene)
        throw "Couldn't get 2D context.";
    
    sceneElement.onmousedown  = (e) => handleMouseInput("down", e);
    sceneElement.onmousemove  = (e) => handleMouseInput("move", e);
    sceneElement.onmouseup    = (e) => handleMouseInput("up", e);     
    sceneElement.onmouseleave = (e) => handleMouseInput("leave", e);
    sceneElement.onmouseenter = (e) => handleMouseInput("enter", e);
    
    sceneElement.ontouchstart = (e) => handleTouchInput("start", e);
    sceneElement.ontouchmove  = (e) => handleTouchInput("move", e);
    sceneElement.ontouchend   = (e) => handleTouchInput("end", e);
    
    console.log("Scene initialized.");
}

function initializeContainer(containerId, onElementCallback) {
    
    const container = document.getElementById(containerId);
    // Couldn't find container
    if (!(container instanceof Element))
        return;

    const elements = container.children;
    const elementsCount = elements.length;
    if (elementsCount > 0) {
        
        if (onElementCallback instanceof Function)
            for (let i = 0; i < elementsCount; i++)
                onElementCallback(elements[i]);
        
        // activate first element by default
        elements[0].click();
    }
}

function getColor(element) {
    return (element instanceof Element ? element.style.backgroundColor : "#000000");
}

function getBrushSize(element) {
    
    let brushSize = new Number(element instanceof Element ? element.innerText : "");
    if (isNaN(brushSize))
        brushSize = 0;
    
    const clamp = (x, min, max) => { return x <= min ? min : x > max ? max : x };
    
    brushSize = clamp(brushSize, 1, 100);
    
    return brushSize;
}

function setActiveElement(oldElement, newElement) {
    
    const activeClass = "active_button";
    
    if (oldElement instanceof Element)
        oldElement.classList.remove(activeClass);
    
    if (newElement instanceof Element)
        newElement.classList.add(activeClass);        
    
    return newElement;
}

function setupColor(colorElement) {
    
    activeColorElement = setActiveElement(activeColorElement, colorElement);
    
    console.info("Color is set to " + getColor(colorElement) + ".");
}

function setupBrushSizes(brushSizeElement) {
    
    activeBrushSizeElement = setActiveElement(activeBrushSizeElement, brushSizeElement);
        
    console.info("Brush size is set to " + getBrushSize(brushSizeElement) + ".");
}

function pointAbsoluteToRelative(x, y) {
    
    const offsetLeft = sceneElement.offsetLeft;
    const offsetTop = sceneElement.offsetTop;
    
    const styling = getComputedStyle(sceneElement, null);
    const leftBorder = parseInt(styling.getPropertyValue("border-left-width"), 10); 
    const topBorder = parseInt(styling.getPropertyValue("border-top-width"), 10);
 
    return { x: x - (offsetLeft + leftBorder), y: y - (offsetTop + topBorder) };
}

function handlePointInput(isInputPresent, x, y) {

    if (isInputPresent) {
                   
        const currentMousePosition = pointAbsoluteToRelative(x, y);
        
        drawLineWithActiveBrush(lastMousePosition, currentMousePosition);
        
        lastMousePosition = currentMousePosition;
    }
    else
        lastMousePosition = undefined;  
}

function handleMouseInput(eventName, e) {
        
    const isLMBPresed = (e.which == 1);

    handlePointInput(isLMBPresed, e.pageX, e.pageY);
    
    if (eventName === "leave")
        lastMousePosition = undefined;
}

function handleTouchInput(eventName, e) {
    
    if (eventName !== "end" && e.touches.length > 0) {
        
        const touch = e.touches.item(0);
        
        handlePointInput(true, touch.pageX, touch.pageY);         
    }
    else
        handlePointInput(false);
}

function drawLineWithActiveBrush(fromPosition, toPosition) {
        
    if (fromPosition === undefined)
        fromPosition = toPosition;
    
    scene.lineCap = "round";
    scene.strokeStyle = getColor(activeColorElement); 
    scene.lineWidth = getBrushSize(activeBrushSizeElement);
   
    const blurFixOffset = 0.5;
   
    scene.beginPath();
    scene.moveTo(fromPosition.x + blurFixOffset, fromPosition.y + blurFixOffset);
    scene.lineTo(toPosition.x + blurFixOffset, toPosition.y + blurFixOffset);
    scene.stroke();
}

function clearScene() {
    scene.clearRect(0, 0, sceneElement.width, sceneElement.height);
}

const serializedSceneItemName = "serializedScene";

function saveScene() {
    
    console.info("Saving scene...");
    
    const serializedScene = sceneElement.toDataURL("image/png");
    
    localStorage.setItem(serializedSceneItemName, serializedScene);
    
    console.info("Scene was saved.");
}

function loadScene() {
        
    console.info("Loading scene...");
    
    const serializedScene = new String(localStorage.getItem(serializedSceneItemName));
        
    if (serializedScene.startsWith("data:image/png;base64,")) {
    
        const image = new Image();
        image.onload = () => {
            scene.drawImage(image, 0, 0);
            console.info("Scene was loaded.");
        };
        image.onerror = () => {
            console.warn("Failed to load a scene.");
        }
        image.src = serializedScene;
    }
    else {
        console.info("Scene was not found in storage or format is incorrect.");
    }
}

function handleStorageInput(e) {
    
    if (e.key === serializedSceneItemName) {
        
        console.info("Scene was updated externally, causing reload.");
        
        loadScene();
    }
}

initialize();