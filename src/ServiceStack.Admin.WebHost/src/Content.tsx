﻿/// <reference path='../typings/main.d.ts'/>

import * as React from 'react';
import 'jquery';
import 'ss-utils';
import Results from './Results';

export default class Content extends React.Component<any, any> {
    constructor(props?, context?) {
        super(props, context);
        this.state = { results: null };
    }

    selectField(e) {
        this.props.onChange({ searchField: e.target.options[e.target.selectedIndex].value });
    }

    selectOperand(e) {
        this.props.onChange({ searchType: e.target.options[e.target.selectedIndex].value });
    }

    changeText(e) {
        this.props.onChange({ searchText: e.target.value});
    }

    selectFormat(format) {
        if (format === this.props.values.format) //toggle
            format = "";

        this.props.onChange({ format });
    }

    getAutoQueryUrl() {
        const firstRoute = (this.props.selected.requestType.routes || []).filter(x => x.path.indexOf('{') === -1)[0];
        const path = firstRoute ? firstRoute.path : '/json/reply/' + this.props.selected.requestType.name;        
        var url = $.ss.combinePaths(this.props.config.servicebaseurl, path);

        if (this.props.values.format)
            url += "." + this.props.values.format;

        this.getArgs().forEach(arg =>
            url = $.ss.createUrl(url, arg));

        url = url.replace("%2C", ",");

        return url;
    }

    isValidCondition() {
        const { searchField, searchType, searchText } = this.props.values;
        return searchField && searchType && searchText
            && (searchType.toLowerCase() !== 'between' || (searchText.indexOf(',') > 0 && searchText.indexOf(',') < searchText.length -1));
    }

    getArgs() {
        var args = [];
        var conditions = (this.props.values.conditions || []).slice(0);
        if (this.isValidCondition()) {
            conditions.push(this.props.values);
        }

        conditions.forEach(condition => {
            const { searchField, searchType, searchText } = condition;
            var convention = this.props.conventions.filter(c => c.name === searchType)[0];
            if (convention) {
                var field = convention.value.replace("%", searchField);
                args.push({ [field]: searchText });
            }
        });

        return args;
    }

    renderResults(response) {
        var fieldNames = null, fieldWidths = null;
        var fieldDefs = (this.props.viewerArgs["SummaryFields"] || "")
            .split(',')
            .filter(x => x.trim().length > 0);

        if (fieldDefs.length > 0) {
            fieldNames = [], fieldWidths = {};
            fieldDefs.forEach(x => {
                var parts = $.ss.splitOnFirst(x, ':');
                fieldNames.push(parts[0]);
                if (parts.length > 1)
                    fieldWidths[parts[0].toLowerCase()] = parts[1];
            });
        }

        return response.results.length === 0
            ? <div className="results-none">There were no results</div>
            : (
                <div>
                    <div style={{ color: '#757575', padding: '15px' }}>
                        Showing Results {response.offset + 1} - {response.offset + response.results.length} of {response.total}
                    </div>

                    <Results results={response.results} fieldNames={fieldNames} fieldWidths={fieldWidths} />
                </div>
            );
    }

    renderBody(op, values) {
        const url = this.getAutoQueryUrl();
        if (!this.state.response || this.state.response.url !== url) {
            $.getJSON(url, { jsconfig: "DateHandler:ISO8601DateOnly"}, r => {
                var response = $.ss.normalize(r);
                response.url = url;
                this.setState({ response });
            });
        }

        return (
            <div>
                <div style={{ color: '#757575', position: 'absolute', right: '300px', background:'#eee' }}>
                    {this.props.viewerArgs["Description"] }
                </div>
                <div id="url" style={{ padding: '0 0 10px 0' }}>
                    <a href={url} target="_blank">{url}</a>
                </div>

                <select value={values.searchField} onChange={e => this.selectField(e) }>
                    <option></option>
                    {op.fromType.properties.map(
                        p => <option key={p.name}>{p.name}</option>) }
                </select>
                <select value={values.searchType} onChange={e => this.selectOperand(e) }>
                    <option></option>
                    {this.props.conventions.map(
                        c => <option key={c.name}>{c.name}</option>) }
                </select>
                <input type="text" id="txtSearch" value={values.searchText}
                    onChange={e => this.changeText(e) }
                    onKeyDown={e => e.keyCode === 13 ? this.props.onAddCondition() : null} />

                {this.isValidCondition()
                    ? (<i className="material-icons" style={{ fontSize: '30px', verticalAlign: 'bottom', color: '#00C853', cursor: 'pointer' }}
                        onClick={e => this.props.onAddCondition() } title="Add condition">add_circle</i>)
                    : (<i className="material-icons" style={{ fontSize: '30px', verticalAlign: 'bottom', color: '#ccc' }}
                        title="Incomplete condition">add_circle</i>)}

                {!this.props.config.formats || this.props.config.formats.length === 0 ? null : (
                    <span className="formats noselect">
                        {this.props.config.formats.map(f =>
                            <span className={values.format === f ? 'active' : ''} onClick={e => this.selectFormat(f)}>{f}</span>) }
                    </span>)}

                <div className="conditions">
                    {this.props.values.conditions.map(c => (
                        <div>
                            <i className="material-icons" style={{ color: '#db4437', cursor: 'pointer', padding: '0 5px 0 0' }}
                                title="remove condition"
                                onClick={e => this.props.onRemoveCondition(c) }>remove_circle</i>
                            {c.searchField} {c.searchType} {c.searchText}
                        </div>
                    ))}
                </div>

                { this.state.response ? this.renderResults(this.state.response) : null }

            </div>
        );
    }

    render() {
        return (
            <div id="content" style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'auto' }}>
                <div style={{ padding: '90px 0 0 20px' }}>
                    <table>
                        <tr>
                            <td>
                                {this.props.selected
                                    ? this.renderBody(this.props.selected, this.props.values)
                                    : <div style={{ padding: '15px 0' }}>Please Select a Query</div> }
                            </td>
                            <td style={{minWidth:'290px'}}></td>
                        </tr>
                     </table>
                </div>
            </div>
        );
    }
}