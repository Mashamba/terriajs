'use strict';

/*global require*/
var React = require('react');
var Loader = require('./Loader.jsx'),
    FeatureInfoCatalogItem = require('./FeatureInfoCatalogItem.jsx'),
    when = require('terriajs-cesium/Source/ThirdParty/when'),
    defined = require('terriajs-cesium/Source/Core/defined');


var FeatureInfoPanel = React.createClass({
    propTypes: {
        terria: React.PropTypes.object
    },

    getInitialState: function() {
        return {
            pickedFeatures: undefined,
            featureSections: undefined,
            isVisible: true,
            isCollapsed: false
        };
    },

    componentWillMount: function() {
        this.getFeatures();
    },

    componentWillReceiveProps: function() {
        this.setState({
            isVisible: true,
            isCollapsed: false
        });

        this.getFeatures();
    },

    getFeatures: function() {
        var that = this;
        if (defined(that.props.terria.pickedFeatures)) {
            when(that.props.terria.pickedFeatures.allFeaturesAvailablePromise).then(function() {
                //addSectionsForFeatures(that.props.terria);
                that.setState({
                    pickedFeatures: addSectionsForFeatures(that.props.terria)
                });
            });
        }
    },

    closeFeatureInfoPanel: function() {
        this.setState({
            isVisible: false,
            pickedFeatures: undefined
        });
    },

    toggleCollapseFeatureInfoPanel: function() {
        this.setState({
            isCollapsed: !this.state.isCollapsed
        });
    },

    renderContent(pickedFeatures){
        let that = this;
        if (defined(this.props.terria.pickedFeatures)){
            //since event is raised after loaded, isLoading is never true
            if (this.props.terria.pickedFeatures.isLoading === true){
                return <Loader/>;
            } else {
                if (pickedFeatures && pickedFeatures.length > 0) {
                    return pickedFeatures.map(function(features, i) {
                        return (<FeatureInfoCatalogItem key={i} features={features} clock={that.props.terria.clock} />);
                    });
                } else {
                    return <li className='no-results'> No results </li>;
                }
            }
        } else {
            return <li className='no-results'> No results </li>;
        }
    },

    render() {
        let pickedFeatures = this.state.pickedFeatures;

        return (
            <div className={'feature-info-panel ' + (this.state.isCollapsed ? 'is-collapsed' : '')} aria-hidden={!this.state.isVisible}>
              <div className='feature-info-panel__header'>
                <button onClick={this.toggleCollapseFeatureInfoPanel} className='btn'> Feature Info Panel </button>
                <button onClick={this.closeFeatureInfoPanel} className="btn modal-btn right" title="Close data panel"><i className="icon icon-close"></i></button>
              </div>
              <ul className="list-reset feature-info-panel__body">{this.renderContent(pickedFeatures)}</ul>
            </div>
        );
    }
});

//to add multiple catalog when several dataset turned on at the same time

function addSectionsForFeatures(terria) {
    var features = terria.pickedFeatures.features;
    var catalogItem;
    var sections = [];
    features.forEach(function(feature) {
        if (!defined(feature.position)) {
            feature.position = terria.pickedFeatures.pickPosition;
        }
        catalogItem = calculateCatalogItem(terria.nowViewing, feature);
        // if feature does not have a catalog item?
        if (!defined(catalogItem)) {
            sections.push({
                catalogItem: undefined,
                feature: feature
            });
        } else {
            var newItem = true,
                existingItemIndex;
            for (var i = sections.length - 1; i >= 0; i--) {
                if (catalogItem === sections[i].catalogItem) {
                    newItem = false;
                    existingItemIndex = i;
                }
            }
            if (newItem === true) {
                sections.push({
                    catalogItem: catalogItem,
                    features: [feature]
                });
            } else {
                sections[existingItemIndex].features.push(feature);
            }
        }
    });
    return sections;
}

function calculateCatalogItem(nowViewing, feature) {
    // some data sources (czml, geojson, kml) have an entity collection defined on the entity
    // (and therefore the feature)
    // then match up the data source on the feature with a now-viewing item's data source
    var result, i;
    if (!defined(nowViewing)) {
        // so that specs do not need to define a nowViewing
        return undefined;
    }
    if (defined(feature.entityCollection) && defined(feature.entityCollection.owner)) {
        var dataSource = feature.entityCollection.owner;
        for (i = nowViewing.items.length - 1; i >= 0; i--) {
            if (nowViewing.items[i].dataSource === dataSource) {
                result = nowViewing.items[i];
                break;
            }
        }
        return result;
    }
    // If there is no data source, but there is an imagery layer (eg. ArcGIS)
    // we can match up the imagery layer on the feature with a now-viewing item.
    if (defined(feature.imageryLayer)) {
        var imageryLayer = feature.imageryLayer;
        for (i = nowViewing.items.length - 1; i >= 0; i--) {
            if (nowViewing.items[i].imageryLayer === imageryLayer) {
                result = nowViewing.items[i];
                break;
            }
        }
        return result;
    }
    // otherwise, no luck
    return undefined;
}

module.exports = FeatureInfoPanel;