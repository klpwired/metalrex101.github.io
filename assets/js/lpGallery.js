/**
 * @constructor
 * @param {int} data.items[].id - id of item
 * @param {string} data.items[].src - src of Img
 * @param {string} data.items[].title - title of Img
 * @param {string} data.items[].link - link above the Img
 * @param {string} data.imgFolder - overwrite default Images folder
 * @param {string} data.thumbs - selectors of your thumbnails. Example: '.post_thumbnail img, .content_wrapper img'
 */
var Gallery = function (data) {
    var items = (typeof data.items == "undefined" && typeof data.thumbs != "undefined") ? this.initFromDom(data.thumbs) : data.items;
    this.thumbs = data.thumbs;
    this.linkedList = new LinkedList(items);
    this.imgFolder = data.imgFolder || "images";
    this.loading = false;
    this.status = false;
    this.slide_prev = true;
    this.slide_next = true;
    this.callbackLeft = null;
    this.callbackRight = null;
    this.wrapperLoader = $('<img>', {
        src: this.imgFolder + "/loading.gif",
        alt: "loading..",
        class: "wrapperLoader" }
    );
    var _this = this;

    // bind close event
    $(document).on('click', '.lpDynamicGallery .close', function () {
        _this.close();
    });

    // bind prev event
    $(document).on('click', '.lpDynamicGallery #prev:not(load)', function () {
        _this.prev();
    });

    // bind next event
    $(document).on('click', '.lpDynamicGallery #next:not(load)', function () {
        _this.next();
    });

    // bind open event
    $(document).on('click', this.thumbs, function(){
        var id = $(this).data('id');
        var slide = _this.linkedList.getNodeById(id).data;
        _this.open(slide, _this);
    });

    // bind keyboard buttons to navigate gallery
    $(document).keydown(function(e){
        if(_this.status){
            switch(e.keyCode){
                case 37: _this.prev(); break;
                case 39: _this.next(); break;
                case 27: _this.close(); break;
            }
        }
    });
};

/**
 *
 * @param {string} thumbs
 * @return {object[]}
 * @description initialize gallery from DOM
 */
Gallery.prototype.initFromDom = function(thumbs){
    var list = [];
    $.each($(thumbs), function(id, thumb){
        $(thumb).data('id', id).css('cursor', 'pointer');
        list.push({
            id: id,
            src: $(thumb).attr('src'),
            title: $(thumb).attr('title'),
            link: $(thumb).data('href')
        });
    });
    return list;
};

/**
 * @method
 * @param {object[]} list - array of objects
 * @param {string} list[].src - src of Img
 * @param {string} list[].title - title of Img
 * @param {string} list[].link - link above the Img
 * @description removing previous left callback, prepend objects to linked list
 */
Gallery.prototype.prepend = function(list){
    this.linkedList.iterate(this.removeCallbackLeft); // removing previous left callback
    this.linkedList.addBefore(list); // prepend photos to linked list
};

/**
 * @method
 * @param {object[]} list - array of objects
 * @param {string} list[].src - src of Img
 * @param {string} list[].title - title of Img
 * @param {string} list[].link - link above the Img
 * @description removing previous right callback, append objects to linked list
 */
Gallery.prototype.append = function(list){
    this.linkedList.iterate(this.removeCallbackRight); // removing previous right callback
    this.linkedList.addAfter(list); // append photos to linked list
};

/**
 * @method
 * @param {string} direction - could be 'prev' or 'next'
 * @description toggle loader
 */
Gallery.prototype.toggleLoader = function(direction){
    var selector = '#'+direction;
    $(selector).toggleClass('load');
    this.loading = !this.loading;
    if(!$(selector).hasClass('load')){
        this['slide_' + direction] = true;
    }
};

/**
 * @method
 * @param {string} direction - could be 'prev' or 'next'
 * @description hide arrow in case of given direction
 */
Gallery.prototype.hideArrow = function(direction){
    var selector = '#'+direction;
    $(selector).stop().fadeOut('slow');
    this['slide_' + direction] = false;
};

/**
 * @method
 * @param {string} direction - could be 'prev' or 'next'
 * @description show arrow in case of given direction
 */
Gallery.prototype.showArrow = function(direction){
    var selector = '#'+direction;
    $(selector).stop().fadeIn('slow');
    this['slide_' + direction] = true;
};

/**
 * @method
 * @description change photo to previous one, call callback function, if needed
 */
Gallery.prototype.prev = function () {
    if(this.slide_prev){
        // get previous object from list
        var prev = this.linkedList.getPrev().data;
        // set slide
        this.setSlide(prev);
        // call callback if needed
        if(typeof prev.callbackLeft != "undefined") prev.callbackLeft.call(this);
        // hide arrow if no more left slides and no loading
        if(!this.linkedList.hasPrev() && !this.loading) this.hideArrow('prev');
        if(!this.slide_next) this.showArrow('next');
    }
};

/**
 * @method
 * @description change photo to next one, call callback function, if needed
 */
Gallery.prototype.next = function () {
    if(this.slide_next){
        // get next object from list
        var next = this.linkedList.getNext().data;
        // set slide
        this.setSlide(next);
        // call callback if needed
        if(typeof next.callbackRight != "undefined") next.callbackRight();
        // hide arrow if no more left slides and no loading
        if(!this.linkedList.hasNext() && !this.loading) this.hideArrow('next');
        if(!this.slide_prev) this.showArrow('prev');
    }
};

/**
 * @callback removeCallbackLeft
 * @param {Node} node - instance of Node object
 * @description remove left callback from Node.data object
 */
Gallery.prototype.removeCallbackLeft = function(node){
    delete node.data.callbackLeft;
};

/**
 * @callback removeCallbackLeft
 * @param {Node} node - instance of Node object
 * @description remove right callback from Node.data object
 */
Gallery.prototype.removeCallbackRight = function(node){
    delete node.data.callbackRight;
};

/**
 * @method
 * @param {Node.data} slide
 * @description set the slide, resize it to the window
 */
Gallery.prototype.setSlide = function(slide){
    var imageContainer = $('.imagesContainer'),
        wrapper = $('.lpDynamicGallery .wrapper'),
        image = $('.lpDynamicGallery .images .wrapper img'),
        title = $('.lpDynamicGallery .title');

    // set link
    $('.lpDynamicGallery .title a').prop({
        href: slide.link || "",
        text: slide.title || ""
    });
    // set image
    image.attr({
        src: slide.src,
        alt: slide.title
    });

    // resize slide
    Photo.resize({
        photo: image,
        width: imageContainer.width(),
        height: imageContainer.height() - title.height(),
        /**
         * @callback beforeResize
         */
        beforeResize: (function (_this) {
            return function(){
                wrapper.hide();
                imageContainer.append(_this.wrapperLoader);
            }
        })(this),
        /**
         * @callback afterResize
         */
        afterResize: (function (_this) {
            return function(){
                imageContainer.find(_this.wrapperLoader).remove();
                wrapper.show();
            }
        })(this)
    });

};

/**
 * @param {Node.data} slide
 * @param {Gallery} _this - link to the Gallery instance
 * @description open gallery with passed slide
 */
Gallery.prototype.open = function (slide, _this) {
    $('body').css('overflow-y', 'hidden');
    _this.status = true;

    $('.lpDynamicGallery').fadeIn('fast');

    $('#prev').css('display', _this.slide_prev ? "" : "none");
    $('#next').css('display', _this.slide_next ? "" : "none");

    _this.setSlide(slide);
};

/**
 * @method
 * @description close gallery
 */
Gallery.prototype.close = function () {
    this.status = false;
    $('.lpDynamicGallery').fadeOut('fast');
    this.showArrow('prev');
    this.showArrow('next');
    $('body').css('overflow-y', 'auto');
};

/**
 * @constructor create LinkedList instance
 * @param {Object[]} data - array of slides
 */
var LinkedList = function(data){
    this.current = false;

    if (typeof data != "undefined"){
        var keys = Object.keys(data);
        if(keys.length > 0){
            var newData = this.addFirst(data);

            for(var id in newData) {
                var current = this.current;
                this.current.next = new Node(data[id]);
                this.current = this.current.next;
                this.current.prev = current;
            }
            this.current.next = null;
        }
    }
};

/**
 * @method
 * @param {int} id
 * @description search for node with data.id == id
 */
LinkedList.prototype.getNodeById = function(id){
    var current = this.getFirst();
    while(current.data.id != id){
        current = current.next;
    }
    this.current = current;
    return current;
};

/**
 * @method
 * @description set current to the first node
 */
LinkedList.prototype.toBegin = function(){
    while(this.prev()){}
};

/**
 * @method
 * @description set current to the last node
 */
LinkedList.prototype.toEnd = function(){
    while(this.next()){}
};

/**
 * @method
 * @description set current to the first node
 * @return {Node} first node
 */
LinkedList.prototype.getFirst = function () {
    var current = this.current;
    while(current.prev !== null){
        current = current.prev;
    }
    return current;
};

/**
 * @method
 * @description set current to the last node
 * @return {Node} last node
 */
LinkedList.prototype.getLast = function () {
    var current = this.current;
    while(current.next !== null){
        current = current.next;
    }
    return current;
};

/**
 * @method
 * @description print all the list from 1st element to console
 */
LinkedList.prototype.print = function(){
    var i = 0, current = this.getFirst();
    while(current !== null){
        console.log(i++, current);
        current = current.next;
    }
};

/**
 * @method
 * @return {boolean}
 */
LinkedList.prototype.hasPrev = function(){
    return this.current.prev !== null;
};

/**
 * @method
 * @return {Node|boolean}
 */
LinkedList.prototype.getPrev = function () {
    if(this.current.prev !== null){
        return this.current = this.current.prev;
    }
    return false;
};

/**
 * @method
 * @description set prev node as current
 * @return {boolean}
 */
LinkedList.prototype.prev = function(){
    if(this.current.prev !== null){
        this.current = this.current.prev;
        return true;
    }
    return false;
};

/**
 * @method
 * @return {boolean}
 */
LinkedList.prototype.hasNext = function(){
    return this.current.next !== null;
};

/**
 * @method
 * @return {Node|boolean}
 */
LinkedList.prototype.getNext = function () {
    if(this.current.next !== null){
        return this.current = this.current.next;
    }
    return false;
};

/**
 * @method
 * @description set next node as current
 * @return {boolean}
 */
LinkedList.prototype.next = function(){
    if(this.current.next !== null){
        this.current = this.current.next;
        return true;
    }
    return false;
};

/**
 * @method
 * @return {boolean}
 */
LinkedList.prototype.isEmpty = function () {
    return this.current != false;
};

/**
 * @method
 * @param {object} data
 * @description create Node objects from data, prepend them to list
 */
LinkedList.prototype.addBefore = function (data) {

    var current = this.getFirst();
    for(var id in data){
        var next = current;
        current.prev = new Node(data[id]);
        current = current.prev;
        current.next = next;
    }
    current.prev = null;
};

/**
 * @method
 * @param {object} data
 * @description create Node objects from data, prepend them to list
 */
LinkedList.prototype.addAfter = function (data) {

    var current = this.getLast();
    for(var id in data){
        var prev = current;
        current.next = new Node(data[id]);
        current = current.next;
        current.prev = prev;
    }
    current.next = null;
};

/**
 * @method
 * @param {object} data
 * @return {object} data without 1st element
 */
LinkedList.prototype.addFirst = function (data) {

    this.current = new Node(data.shift());
    this.current.prev = null;
    this.current.next = null;
    return data;
};

/**
 * @method
 * @param {removeCallbackLeft|removeCallbackRight} callback - function to call at each node
 * @description iterates over nodes, execute callback function for each node
 */
LinkedList.prototype.iterate = function(callback){
    var current = this.getFirst();
    while(current.next != null){
        callback(current);
        current = current.next;
    }
};

/**
 * @constructor
 * @param {object} data
 */
var Node = function (data) {
    this.data = data;
    this.next = null;
    this.prev = null;
};

var Photo = {
    /**
     * @static
     * @method
     * @param {object} data.photo - Photo
     * @param {int} data.width - Container width
     * @param {int} data.height - Container height
     * @param {beforeResize} data.beforeResize - called before resize
     * @param {afterResize} data.afterResize - called after resize
     * @description resize photo to window
     */
    resize: function(data) {
        var photo = data.photo,
            width = data.width,
            height = data.height,
            beforeResize = data.beforeResize,
            afterResize = data.afterResize;

        beforeResize();

        if(photo.attr('src')=='') return;
        var newImg = new Image();
        newImg.src = photo.attr('src');

        newImg.onload = function() {
            var heightPhoto = newImg.height;
            var widthPhoto = newImg.width;
            var left;
            if(heightPhoto < height && widthPhoto < width){
                width = widthPhoto;
                height = heightPhoto;
                left = 0;
            }else{
                var newWidth = widthPhoto/(heightPhoto/height);
                var newHeight = heightPhoto/(widthPhoto/width);

                width = newWidth > width ? width : newWidth;
                height = newHeight > height ? height : newHeight;
                left = newWidth > width ? 0 : -(newWidth-width)/2;
            }

            photo.css({
                "height": height,
                'width': width,
                'left': left,
                'position': 'relative',
                'display': 'block'
            });

            afterResize();
        }
    }
};