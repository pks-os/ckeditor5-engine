/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module engine/view/observer/inputobserver
 */

import DomEventObserver from './domeventobserver';

/**
 * The `beforeinput` and `input` event observer.
 *
 * Note that this observer is attached by the {@link module:engine/view/view~View} and is available by default.
 *
 * @extends module:engine/view/observer/domeventobserver~DomEventObserver
 */
export default class InputObserver extends DomEventObserver {
	constructor( view ) {
		super( view );

		this.domEventType = [ 'beforeinput', 'input' ];
	}

	onDomEvent( domEvent ) {
		this.fire( domEvent.type, domEvent );
	}
}
