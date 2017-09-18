/**
* JointJS Shapes
*/

joint.shapes.tm = {};

joint.shapes.tm.Softgoal = joint.shapes.basic.Path.extend({
    defaults: joint.util.deepSupplement({

        type: 'tm.Softgoal',
        attrs: {
            text: { 
                'ref-y': 0.5, 
                'y-alignment': 'middle',
            },
            path: { 
                'stroke-width': 2,
                d: 'M 44.36 0.00 L 55.04 0.00 C 60.22 2.94 66.21 3.57 72.03 4.18 C 92.62 6.24 113.34 6.63 134.02 6.73 C 154.06 6.71 174.13 6.34 194.12 4.65 C 199.92 4.11 205.77 3.61 211.42 2.09 C 211.39 2.85 211.32 4.38 211.29 5.14 C 211.51 4.08 211.79 3.03 211.99 1.96 C 213.42 1.68 214.68 1.03 215.77 0.00 L 229.45 0.00 C 244.10 2.89 257.30 12.09 265.32 24.66 C 272.43 35.64 275.45 49.15 273.75 62.12 C 271.80 78.41 262.19 93.53 248.34 102.32 C 238.28 108.88 226.09 111.82 214.13 111.15 C 214.33 110.47 214.72 109.11 214.91 108.42 C 214.65 109.13 214.12 110.54 213.86 111.24 C 200.44 108.28 186.65 107.71 172.97 107.01 C 145.98 105.95 118.94 105.97 91.97 107.31 C 79.16 108.08 66.18 108.81 53.73 112.00 L 53.23 112.00 C 48.49 110.10 43.21 110.27 38.44 108.41 C 17.64 101.83 1.94 82.17 0.00 60.44 L 0.00 49.33 C 0.99 41.10 3.53 33.03 7.87 25.95 C 15.77 12.76 29.30 3.10 44.36 0.00 Z' 
                 }
        },
        size: { width: 120, height: 50 }
    }, joint.shapes.basic.Path.prototype.defaults)
});

joint.shapes.tm.Goal = joint.shapes.basic.Circle.extend({
    defaults: joint.util.deepSupplement({

        type: 'tm.Goal',
        attrs: {
            circle: { 
                fill: '#ffffff',
                stroke: '#000000',
                r: 30,
                'stroke-width': 2
            },             
        },
        size: { width: 120, height: 50 }
    }, joint.shapes.basic.Circle.prototype.defaults)
});

joint.shapes.tm.Task = joint.shapes.basic.Path.extend({

    defaults: joint.util.deepSupplement({

        type: 'tm.Task',
        attrs: {
            text: { 
                'ref-y': 0.5, 
                'y-alignment': 'middle',
            },
            path: { 
                fill: '#ffffff',
                stroke: '#000000',
                'stroke-width': 2,
                d: 'M 20 0 L 100 0 120 20 100 40 20 40 0 20 Z',
            }
        },
        size: { width: 120, height: 50 }
    }, joint.shapes.basic.Path.prototype.defaults)
});

joint.shapes.tm.Resource = joint.shapes.basic.Rect.extend({

    defaults: joint.util.deepSupplement({

        type: 'tm.Resource',
        attrs: {
            rect: { 
                fill: '#ffffff',
                stroke: '#000000',
                'stroke-width': 2,
                transform: "translate(5, 5)",
            },         
        },
        size: { width: 120, height: 50 }
    }, joint.shapes.basic.Rect.prototype.defaults)
});

joint.shapes.tm.Argument = joint.shapes.basic.Path.extend({

    defaults: joint.util.deepSupplement({

        type: 'tm.Argument',
        attrs: {
            text: { 
                'ref-y': 0.5, 
                'y-alignment': 'middle',
            },
            path: { 
                fill: '#ffffff',
                stroke: '#000000',
                'stroke-width': 2,
                d: 'M 0 0 L 80 0 80 10 90 5 80 20 80 40 0 40 Z',
            }
        },
        size: { width: 120, height: 50 }
    }, joint.shapes.basic.Path.prototype.defaults)
});

/**
* JointJS Views
*/

joint.shapes.tm.ElementView = joint.dia.ElementView.extend({

        template: [
            '<div class="html-element">',
            '<div class="label"></div>',
            '<div class="decomposition"></div>',
            '<button class="delete">x</button>',            
            '</div>'
        ].join(''),

        initialize: function() {
            _.bindAll(this, 'updateBox');
            joint.dia.ElementView.prototype.initialize.apply(this, arguments);

            this.$box = $(_.template(this.template)());
            var curView = this;

            this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model));
            // Update the box position whenever the underlying model changes.
            this.model.on('change', this.updateBox, this);
            // Remove the box when the model gets removed from the graph.
            this.model.on('remove', this.removeBox, this);

            this.updateBox();
        },
        render: function() {
            joint.dia.ElementView.prototype.render.apply(this, arguments);
            this.paper.$el.prepend(this.$box);
            this.updateBox();
            return this;
        },
        updateBox: function() {
            // Set the position and dimension of the box so that it covers the JointJS element.
            var bbox = this.model.getBBox();
            // Example of updating the HTML with a data stored in the cell model.
            this.$box.css({
                width: bbox.width,
                height: bbox.height,
                left: bbox.x,
                top: bbox.y,
                transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)'
            });
        },
        highlight: function() {},
        removeBox: function(evt) {
            this.$box.remove();
            rationalGrlModel.removeElement(this.id);
        },
        setLabel: function(name) {
            this.$box.find('.label').text(name);
        },
        getLabel: function(name) {
            return this.$box.find('.label').text();
        },
        setDecomposition: function(type) {
            this.$box.find('.decomposition').text(type);
        }
});

joint.shapes.tm.SoftgoalView = joint.shapes.tm.ElementView;
joint.shapes.tm.GoalView = joint.shapes.tm.ElementView;
joint.shapes.tm.TaskView = joint.shapes.tm.ElementView;
joint.shapes.tm.ResourceView = joint.shapes.tm.ElementView;
joint.shapes.tm.ArgumentView = joint.shapes.tm.ElementView;

/**
* JointJS Links
*/

joint.shapes.tm.Contribution = joint.dia.Link.extend({
    defaults: joint.util.deepSupplement({
        markup: defaultLinkMarkup(),
        type: 'tm.Contribution',
        attrs: {
            '.marker-target': { 
                d: 'M 15 0 L 0 8 15 15 0 8 15 8 0 8 15 0',
                'stroke-width': 3 
            },
            '.connection': { 'stroke-width': 3 },
        },
        labels: [
        { position: 0.5, attrs: { text: { text: 'help (+)', },  }}
    ]
    }, joint.dia.Link.prototype.defaults)
});

joint.shapes.tm.Decomposition = joint.dia.Link.extend({
    defaults: joint.util.deepSupplement({
        markup: defaultLinkMarkup(),
        type: 'tm.Decomposition',
        attrs: {
            '.marker-source': { 
                d: 'M10.833,13.682,10.833,5.5,5.5,5.5,5.5,25.5,10.833,25.5z',
                'stroke-width': 3 
            },
            '.connection': { 'stroke-width': 3}
            
        }
    }, joint.dia.Link.prototype.defaults)
});

joint.shapes.tm.Dependency = joint.dia.Link.extend({
    defaults: joint.util.deepSupplement({
        markup: defaultLinkMarkup(),
        type: 'tm.Dependency',
        attrs: {
            '.marker-target': { 
                d: 'm59.999991,26.418186l-13.499993,0l0,0c-7.455848,0 -13.499998,5.055111 -13.499998,11.290907c0,6.235796 6.04415,11.290907 13.499998,11.290907l13.499993,0l0,-22.581814z',
            },
            '.connection': { 'stroke-width': 3}
        }
    }, joint.dia.Link.prototype.defaults)
});

joint.shapes.tm.Attack = joint.dia.Link.extend({
    defaults: joint.util.deepSupplement({
        type: 'tm.Attack',
        attrs: {
            '.marker-target': { d: 'M 15 0 L 0 8 15 15 Z' },
            '.connection': { 'stroke-width': 3},
        }
    }, joint.dia.Link.prototype.defaults)
});