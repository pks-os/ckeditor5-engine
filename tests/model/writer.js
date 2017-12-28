/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Model from '../../src/model/model';
import Writer from '../../src/model/writer';
import Batch from '../../src/model/batch';
import InsertDelta from '../../src/model/delta/insertdelta';
import WeakInsertDelta from '../../src/model/delta/weakinsertdelta';

import DocumentFragment from '../../src/model/documentfragment';
import Element from '../../src/model/element';
import Text from '../../src/model/text';
import Position from '../../src/model/position';
import Range from '../../src/model/range';

import count from '@ckeditor/ckeditor5-utils/src/count';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';

import { getNodesAndText } from '../../tests/model/_utils/utils';

describe( 'Writer', () => {
	let writer, model, batch, doc;

	beforeEach( () => {
		model = new Model();
		batch = new Batch();
		writer = new Writer( model, batch );
		doc = model.document;
	} );

	describe( 'constructor()', () => {
		it( 'should have model instance', () => {
			expect( writer.model ).to.instanceof( Model );
		} );

		it( 'should have batch instance', () => {
			expect( writer.batch ).to.instanceof( Batch );
		} );
	} );

	describe( 'createText()', () => {
		it( 'should create text node', () => {
			const text = writer.createText( 'foo' );

			expect( text ).to.instanceof( Text );
			expect( text.data ).to.equal( 'foo' );
			expect( Array.from( text.getAttributes() ) ).to.length( 0 );
		} );

		it( 'should create text with attributes', () => {
			const text = writer.createText( 'foo', { foo: 'bar', biz: 'baz' } );

			expect( Array.from( text.getAttributes() ) ).to.deep.equal( [ [ 'foo', 'bar' ], [ 'biz', 'baz' ] ] );
		} );
	} );

	describe( 'createElement()', () => {
		it( 'should create element', () => {
			const element = writer.createElement( 'foo' );

			expect( element ).to.instanceof( Element );
			expect( element.name ).to.equal( 'foo' );
			expect( Array.from( element.getAttributes() ) ).to.length( 0 );
		} );

		it( 'should create element with attributes', () => {
			const element = writer.createText( 'foo', { foo: 'bar', biz: 'baz' } );

			expect( Array.from( element.getAttributes() ) ).to.deep.equal( [ [ 'foo', 'bar' ], [ 'biz', 'baz' ] ] );
		} );
	} );

	describe( 'createDocumentFragment()', () => {
		it( 'should create element', () => {
			const element = writer.createDocumentFragment();

			expect( element ).to.instanceof( DocumentFragment );
		} );
	} );

	describe( 'insert()', () => {
		it( 'should insert node at given position', () => {
			const parent = writer.createDocumentFragment();
			const child = writer.createElement( 'child' );
			const textChild = writer.createText( 'textChild' );

			writer.insert( child, new Position( parent, [ 0 ] ) );
			writer.insert( textChild, new Position( parent, [ 1 ] ) );

			expect( Array.from( parent ) ).to.deep.equal( [ child, textChild ] );
		} );

		it( 'should insert node at the beginning of given element', () => {
			const parent = writer.createDocumentFragment();
			const child1 = writer.createElement( 'child' );
			const child2 = writer.createElement( 'child' );

			writer.insert( child1, parent );
			writer.insert( child2, parent );

			expect( Array.from( parent.getChildren() ) ).to.deep.equal( [ child2, child1 ] );
		} );

		it( 'should insert node at the end of given element', () => {
			const parent = writer.createDocumentFragment();
			const child1 = writer.createElement( 'child' );
			const child2 = writer.createElement( 'child' );

			writer.insert( child1, parent );
			writer.insert( child2, parent, 'end' );

			expect( Array.from( parent.getChildren() ) ).to.deep.equal( [ child1, child2 ] );
		} );

		it( 'should insert node at the given offset of given element', () => {
			const parent = writer.createDocumentFragment();
			const child1 = writer.createElement( 'child' );
			const child2 = writer.createElement( 'child' );
			const child3 = writer.createElement( 'child' );

			writer.insert( child3, parent );
			writer.insert( child1, parent );
			writer.insert( child2, parent, 1 );

			expect( Array.from( parent.getChildren() ) ).to.deep.equal( [ child1, child2, child3 ] );
		} );

		it( 'should insert node before the given node', () => {
			const parent = writer.createDocumentFragment();
			const child1 = writer.createElement( 'child' );
			const child2 = writer.createElement( 'child' );
			const child3 = writer.createElement( 'child' );

			writer.insert( child3, parent );
			writer.insert( child1, parent );
			writer.insert( child2, child3, 'before' );

			expect( Array.from( parent.getChildren() ) ).to.deep.equal( [ child1, child2, child3 ] );
		} );

		it( 'should insert node after the given node', () => {
			const parent = writer.createDocumentFragment();
			const child1 = writer.createElement( 'child' );
			const child2 = writer.createElement( 'child' );
			const child3 = writer.createElement( 'child' );

			writer.insert( child3, parent );
			writer.insert( child1, parent );
			writer.insert( child2, child1, 'after' );

			expect( Array.from( parent.getChildren() ) ).to.deep.equal( [ child1, child2, child3 ] );
		} );

		it( 'should create proper delta for inserting element', () => {
			const parent = writer.createDocumentFragment();
			const element = writer.createElement( 'child' );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.insert( element, parent );

			sinon.assert.calledOnce( spy );
			expect( spy.lastCall.args[ 0 ].type ).to.equal( 'insert' );
			expect( spy.lastCall.args[ 0 ].delta ).to.instanceof( InsertDelta );
			expect( spy.lastCall.args[ 0 ].delta ).to.not.instanceof( WeakInsertDelta );
			expect( spy.lastCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should create proper delta for inserting text', () => {
			const parent = writer.createDocumentFragment();
			const text = writer.createText( 'child' );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.insert( text, parent );

			sinon.assert.calledOnce( spy );
			expect( spy.lastCall.args[ 0 ].type ).to.equal( 'insert' );
			expect( spy.lastCall.args[ 0 ].delta ).to.instanceof( WeakInsertDelta );
			expect( spy.lastCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should move element from one parent to the other within the same document (rootA -> rootA)', () => {
			const rootA = doc.createRoot();
			const parent1 = writer.createElement( 'parent' );
			const parent2 = writer.createElement( 'parent' );
			const node = writer.createText( 'foo' );

			writer.insert( node, parent1 );
			writer.insert( parent1, rootA );
			writer.insert( parent2, rootA );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.insert( node, parent2 );

			// Verify result.
			expect( Array.from( parent1.getChildren() ) ).to.deep.equal( [] );
			expect( Array.from( parent2.getChildren() ) ).to.deep.equal( [ node ] );

			// Verify deltas and operations.
			sinon.assert.calledOnce( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'move' );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should move element from one parent to the other within the same document (rootA -> rootB)', () => {
			const rootA = doc.createRoot( '$root', 'A' );
			const rootB = doc.createRoot( '$root', 'B' );
			const node = writer.createText( 'foo' );

			writer.insert( node, rootA );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.insert( node, rootB );

			// Verify result.
			expect( Array.from( rootA.getChildren() ) ).to.deep.equal( [] );
			expect( Array.from( rootB.getChildren() ) ).to.deep.equal( [ node ] );

			// Verify deltas and operations.
			sinon.assert.calledOnce( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'move' );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should move element from one parent to the other within the same document (docFragA -> docFragA)', () => {
			const docFragA = writer.createDocumentFragment();
			const parent1 = writer.createElement( 'parent' );
			const parent2 = writer.createElement( 'parent' );
			const node = writer.createText( 'foo' );

			writer.insert( node, parent1 );
			writer.insert( parent1, docFragA );
			writer.insert( parent2, docFragA );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.insert( node, parent2 );

			// Verify result.
			expect( Array.from( parent1.getChildren() ) ).to.deep.equal( [] );
			expect( Array.from( parent2.getChildren() ) ).to.deep.equal( [ node ] );

			// Verify deltas and operations.
			sinon.assert.calledOnce( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'move' );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should move element from one parent to the other within different document (document -> docFrag)', () => {
			const root = doc.createRoot();
			const docFrag = writer.createDocumentFragment();
			const node = writer.createText( 'foo' );

			writer.insert( node, root );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.insert( node, docFrag );

			// Verify result.
			expect( Array.from( root.getChildren() ) ).to.deep.equal( [] );
			expect( Array.from( docFrag.getChildren() ) ).to.deep.equal( [ node ] );

			// Verify deltas and operations.
			sinon.assert.calledTwice( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'remove' );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
			expect( spy.secondCall.args[ 0 ].type ).to.equal( 'insert' );
			expect( spy.secondCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should move element from one parent to the other within different document (docFragA -> docFragB)', () => {
			const docFragA = writer.createDocumentFragment();
			const docFragB = writer.createDocumentFragment();
			const node = writer.createText( 'foo' );

			writer.insert( node, docFragA );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.insert( node, docFragB );

			// Verify result.
			expect( Array.from( docFragA ) ).to.deep.equal( [] );
			expect( Array.from( docFragB ) ).to.deep.equal( [ node ] );

			// Verify deltas and operations.
			sinon.assert.calledTwice( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'detach' );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
			expect( spy.secondCall.args[ 0 ].type ).to.equal( 'insert' );
			expect( spy.secondCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should transfer markers from given DocumentFragment', () => {
			const root = doc.createRoot();
			const docFrag = writer.createDocumentFragment();

			writer.appendText( 'abcd', root );
			writer.appendElement( 'p', docFrag );
			writer.insertText( 'foo bar', new Position( docFrag, [ 0, 0 ] ) );

			const marker = new Range( new Position( docFrag, [ 0, 1 ] ), new Position( docFrag, [ 0, 5 ] ) );

			docFrag.markers.set( 'marker', marker );

			writer.insert( docFrag, new Position( root, [ 2 ] ) );

			expect( Array.from( model.markers ).length ).to.equal( 1 );

			const range = model.markers.get( 'marker' ).getRange();
			expect( range.root ).to.equal( root );
			expect( range.start.path ).to.deep.equal( [ 2, 1 ] );
			expect( range.end.path ).to.deep.equal( [ 2, 5 ] );
		} );
	} );

	describe( 'insertText()', () => {
		it( 'should create and insert text node with attributes at given position', () => {
			const parent = writer.createDocumentFragment();

			writer.insertText( 'foo', { bar: 'biz' }, new Position( parent, [ 0 ] ) );

			expect( parent.childCount ).to.equal( 1 );
			expect( parent.getChild( 0 ) ).to.instanceof( Text );
			expect( parent.getChild( 0 ).data ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [ [ 'bar', 'biz' ] ] );
		} );

		it( 'should create and insert text node with no attributes at given position', () => {
			const parent = writer.createDocumentFragment();

			writer.insertText( 'foo', null, new Position( parent, [ 0 ] ) );

			expect( parent.childCount ).to.equal( 1 );
			expect( parent.getChild( 0 ) ).to.instanceof( Text );
			expect( parent.getChild( 0 ).data ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [] );
		} );

		it( 'should create and insert text node omitting attributes param', () => {
			const parent = writer.createDocumentFragment();

			writer.insertText( 'foo', new Position( parent, [ 0 ] ) );

			expect( parent.childCount ).to.equal( 1 );
			expect( parent.getChild( 0 ) ).to.instanceof( Text );
			expect( parent.getChild( 0 ).data ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [] );
		} );

		it( 'should create and insert text node at the beginning of given element', () => {
			const parent = writer.createDocumentFragment();

			writer.insert( writer.createElement( 'child' ), parent );

			writer.insertText( 'foo', parent );

			expect( parent.childCount ).to.equal( 2 );
			expect( parent.getChild( 0 ) ).to.instanceof( Text );
			expect( parent.getChild( 1 ) ).to.instanceof( Element );
		} );

		it( 'should create and insert text node at the end of given element', () => {
			const parent = writer.createDocumentFragment();

			writer.insert( writer.createElement( 'child' ), parent );

			writer.insertText( 'foo', parent, 'end' );

			expect( parent.childCount ).to.equal( 2 );
			expect( parent.getChild( 0 ) ).to.instanceof( Element );
			expect( parent.getChild( 1 ) ).to.instanceof( Text );
		} );

		it( 'should create and insert text node at the given offset of given element', () => {
			const parent = writer.createDocumentFragment();

			writer.insert( writer.createElement( 'child' ), parent );
			writer.insert( writer.createElement( 'child' ), parent );

			writer.insertText( 'foo', parent, 1 );

			expect( parent.childCount ).to.equal( 3 );
			expect( parent.getChild( 0 ) ).to.instanceof( Element );
			expect( parent.getChild( 1 ) ).to.instanceof( Text );
			expect( parent.getChild( 2 ) ).to.instanceof( Element );
		} );

		it( 'should create and insert text node before the given node', () => {
			const parent = writer.createDocumentFragment();
			const child1 = writer.createElement( 'child' );
			const child2 = writer.createElement( 'child' );

			writer.insert( child1, parent );
			writer.insert( child2, parent, 'end' );

			writer.insertText( 'foo', child2, 'before' );

			expect( parent.childCount ).to.equal( 3 );
			expect( parent.getChild( 0 ) ).to.instanceof( Element );
			expect( parent.getChild( 1 ) ).to.instanceof( Text );
			expect( parent.getChild( 2 ) ).to.instanceof( Element );
		} );

		it( 'should create and insert text node after the given node', () => {
			const parent = writer.createDocumentFragment();
			const child1 = writer.createElement( 'child' );
			const child2 = writer.createElement( 'child' );

			writer.insert( child1, parent );
			writer.insert( child2, parent, 'end' );

			writer.insertText( 'foo', child1, 'after' );

			expect( parent.childCount ).to.equal( 3 );
			expect( parent.getChild( 0 ) ).to.instanceof( Element );
			expect( parent.getChild( 1 ) ).to.instanceof( Text );
			expect( parent.getChild( 2 ) ).to.instanceof( Element );
		} );

		it( 'should create proper delta', () => {
			const parent = writer.createDocumentFragment();
			const spy = sinon.spy( model, 'applyOperation' );

			writer.insertText( 'foo', parent );

			sinon.assert.calledOnce( spy );
			expect( spy.lastCall.args[ 0 ].type ).to.equal( 'insert' );
			expect( spy.lastCall.args[ 0 ].delta ).to.instanceof( WeakInsertDelta );
			expect( spy.lastCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );
	} );

	describe( 'insertElement()', () => {
		it( 'should create and insert element with attributes at given position', () => {
			const parent = writer.createDocumentFragment();

			writer.insertElement( 'foo', { bar: 'biz' }, new Position( parent, [ 0 ] ) );

			expect( parent.childCount ).to.equal( 1 );
			expect( parent.getChild( 0 ) ).to.instanceof( Element );
			expect( parent.getChild( 0 ).name ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [ [ 'bar', 'biz' ] ] );
		} );

		it( 'should create and insert element with no attributes at given position', () => {
			const parent = writer.createDocumentFragment();

			writer.insertElement( 'foo', null, new Position( parent, [ 0 ] ) );

			expect( parent.childCount ).to.equal( 1 );
			expect( parent.getChild( 0 ) ).to.instanceof( Element );
			expect( parent.getChild( 0 ).name ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [] );
		} );

		it( 'should create and insert element with no attributes omitting attributes param', () => {
			const parent = writer.createDocumentFragment();

			writer.insertElement( 'foo', new Position( parent, [ 0 ] ) );

			expect( parent.childCount ).to.equal( 1 );
			expect( parent.getChild( 0 ) ).to.instanceof( Element );
			expect( parent.getChild( 0 ).name ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [] );
		} );

		it( 'should create and insert element at the beginning of given element', () => {
			const parent = writer.createDocumentFragment();

			writer.insert( writer.createElement( 'child' ), parent );

			writer.insertElement( 'foo', parent );

			expect( parent.childCount ).to.equal( 2 );
			expect( parent.getChild( 0 ).name ).to.equal( 'foo' );
			expect( parent.getChild( 1 ).name ).to.equal( 'child' );
		} );

		it( 'should create and insert element at the end of given element', () => {
			const parent = writer.createDocumentFragment();

			writer.insert( writer.createElement( 'child' ), parent );

			writer.insertElement( 'foo', parent, 'end' );

			expect( parent.childCount ).to.equal( 2 );
			expect( parent.getChild( 0 ).name ).to.equal( 'child' );
			expect( parent.getChild( 1 ).name ).to.equal( 'foo' );
		} );

		it( 'should create and insert element at the given offset of given element', () => {
			const parent = writer.createDocumentFragment();

			writer.insert( writer.createElement( 'child1' ), parent );
			writer.insert( writer.createElement( 'child2' ), parent, 'end' );

			writer.insertElement( 'foo', parent, 1 );

			expect( parent.childCount ).to.equal( 3 );
			expect( parent.getChild( 0 ).name ).to.equal( 'child1' );
			expect( parent.getChild( 1 ).name ).to.equal( 'foo' );
			expect( parent.getChild( 2 ).name ).to.equal( 'child2' );
		} );

		it( 'should create and insert element before the given node', () => {
			const parent = writer.createDocumentFragment();
			const child1 = writer.createElement( 'child1' );
			const child2 = writer.createElement( 'child2' );

			writer.insert( child1, parent );
			writer.insert( child2, parent, 'end' );

			writer.insertElement( 'foo', child2, 'before' );

			expect( parent.childCount ).to.equal( 3 );
			expect( parent.getChild( 0 ).name ).to.equal( 'child1' );
			expect( parent.getChild( 1 ).name ).to.equal( 'foo' );
			expect( parent.getChild( 2 ).name ).to.equal( 'child2' );
		} );

		it( 'should create and insert element after the given node', () => {
			const parent = writer.createDocumentFragment();
			const child1 = writer.createElement( 'child1' );
			const child2 = writer.createElement( 'child2' );

			writer.insert( child1, parent );
			writer.insert( child2, parent, 'end' );

			writer.insertElement( 'foo', child1, 'after' );

			expect( parent.childCount ).to.equal( 3 );
			expect( parent.getChild( 0 ).name ).to.equal( 'child1' );
			expect( parent.getChild( 1 ).name ).to.equal( 'foo' );
			expect( parent.getChild( 2 ).name ).to.equal( 'child2' );
		} );

		it( 'should create proper delta', () => {
			const parent = writer.createDocumentFragment();
			const spy = sinon.spy( model, 'applyOperation' );

			writer.insertText( 'foo', parent );

			sinon.assert.calledOnce( spy );
			expect( spy.lastCall.args[ 0 ].type ).to.equal( 'insert' );
			expect( spy.lastCall.args[ 0 ].delta ).to.instanceof( InsertDelta );
			expect( spy.lastCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );
	} );

	describe( 'append()', () => {
		it( 'should insert element at the end of the parent', () => {
			const parent = writer.createDocumentFragment();
			const childText = writer.createText( 'foo' );
			const childElement = writer.createElement( 'foo' );

			writer.append( childText, parent );
			writer.append( childElement, parent );

			expect( Array.from( parent ) ).to.deep.equal( [ childText, childElement ] );
		} );

		it( 'should create proper delta', () => {
			const parent = writer.createDocumentFragment();
			const text = writer.createText( 'foo' );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.append( text, parent );

			sinon.assert.calledOnce( spy );
			expect( spy.lastCall.args[ 0 ].type ).to.equal( 'insert' );
			expect( spy.lastCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should move element from one parent to the other within the same document (documentA -> documentA)', () => {
			const rootA = doc.createRoot();
			const parent1 = writer.createElement( 'parent' );
			const parent2 = writer.createElement( 'parent' );
			const node = writer.createText( 'foo' );

			writer.insert( node, parent1 );
			writer.insert( parent1, rootA );
			writer.insert( parent2, rootA );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.append( node, parent2 );

			// Verify result.
			expect( Array.from( parent1.getChildren() ) ).to.deep.equal( [] );
			expect( Array.from( parent2.getChildren() ) ).to.deep.equal( [ node ] );

			// Verify deltas and operations.
			sinon.assert.calledOnce( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'move' );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should move element from one parent to the other within the same document (documentA -> documentB)', () => {
			const rootA = doc.createRoot( '$root', 'A' );
			const rootB = doc.createRoot( '$root', 'B' );
			const node = writer.createText( 'foo' );

			writer.insert( node, rootA );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.append( node, rootB );

			// Verify result.
			expect( Array.from( rootA.getChildren() ) ).to.deep.equal( [] );
			expect( Array.from( rootB.getChildren() ) ).to.deep.equal( [ node ] );

			// Verify deltas and operations.
			sinon.assert.calledOnce( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'move' );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should move element from one parent to the other within the same document (docFragA -> docFragA)', () => {
			const docFragA = writer.createDocumentFragment();
			const parent1 = writer.createElement( 'parent' );
			const parent2 = writer.createElement( 'parent' );
			const node = writer.createText( 'foo' );

			writer.insert( node, parent1 );
			writer.insert( parent1, docFragA );
			writer.insert( parent2, docFragA );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.append( node, parent2 );

			// Verify result.
			expect( Array.from( parent1.getChildren() ) ).to.deep.equal( [] );
			expect( Array.from( parent2.getChildren() ) ).to.deep.equal( [ node ] );

			// Verify deltas and operations.
			sinon.assert.calledOnce( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'move' );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should move element from one parent to the other within different document (document -> docFrag)', () => {
			const root = doc.createRoot();
			const docFrag = writer.createDocumentFragment();
			const node = writer.createText( 'foo' );

			writer.insert( node, root );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.append( node, docFrag );

			// Verify result.
			expect( Array.from( root.getChildren() ) ).to.deep.equal( [] );
			expect( Array.from( docFrag.getChildren() ) ).to.deep.equal( [ node ] );

			// Verify deltas and operations.
			sinon.assert.calledTwice( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'remove' );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
			expect( spy.secondCall.args[ 0 ].type ).to.equal( 'insert' );
			expect( spy.secondCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );

		it( 'should move element from one parent to the other within different document (docFragA -> docFragB)', () => {
			const docFragA = writer.createDocumentFragment();
			const docFragB = writer.createDocumentFragment();
			const node = writer.createText( 'foo' );

			writer.insert( node, docFragA );

			const spy = sinon.spy( model, 'applyOperation' );

			writer.append( node, docFragB );

			// Verify result.
			expect( Array.from( docFragA ) ).to.deep.equal( [] );
			expect( Array.from( docFragB ) ).to.deep.equal( [ node ] );

			// Verify deltas and operations.
			sinon.assert.calledTwice( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'detach' );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
			expect( spy.secondCall.args[ 0 ].type ).to.equal( 'insert' );
			expect( spy.secondCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );
	} );

	describe( 'appendText()', () => {
		it( 'should create and insert text node with attributes at the end of the parent', () => {
			const parent = writer.createDocumentFragment();

			writer.appendText( 'foo', { bar: 'biz' }, parent );
			writer.appendText( 'bar', { biz: 'bar' }, parent );

			expect( parent.childCount ).to.equal( 2 );
			expect( parent.getChild( 0 ).data ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [ [ 'bar', 'biz' ] ] );
			expect( parent.getChild( 1 ).data ).to.equal( 'bar' );
			expect( Array.from( parent.getChild( 1 ).getAttributes() ) ).to.deep.equal( [ [ 'biz', 'bar' ] ] );
		} );

		it( 'should create and insert text node with no attributes at the end of the parent', () => {
			const parent = writer.createDocumentFragment();

			writer.appendText( 'foo', null, parent );

			expect( parent.childCount ).to.equal( 1 );
			expect( parent.getChild( 0 ) ).to.instanceof( Text );
			expect( parent.getChild( 0 ).data ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [] );
		} );

		it( 'should create and insert text node with no attributes omitting attributes param', () => {
			const parent = writer.createDocumentFragment();

			writer.appendText( 'foo', parent );

			expect( parent.childCount ).to.equal( 1 );
			expect( parent.getChild( 0 ) ).to.instanceof( Text );
			expect( parent.getChild( 0 ).data ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [] );
		} );

		it( 'should create proper delta and operations', () => {
			const parent = writer.createDocumentFragment();
			const spy = sinon.spy( model, 'applyOperation' );

			writer.appendText( 'foo', parent );

			sinon.assert.calledOnce( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'insert' );
			expect( spy.firstCall.args[ 0 ].delta ).to.instanceof( WeakInsertDelta );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );
	} );

	describe( 'appendElement()', () => {
		it( 'should create and insert element with attributes at the end of the parent', () => {
			const parent = writer.createDocumentFragment();

			writer.appendElement( 'foo', { bar: 'biz' }, parent );
			writer.appendElement( 'bar', { biz: 'bar' }, parent );

			expect( parent.childCount ).to.equal( 2 );
			expect( parent.getChild( 0 ).name ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [ [ 'bar', 'biz' ] ] );
			expect( parent.getChild( 1 ).name ).to.equal( 'bar' );
			expect( Array.from( parent.getChild( 1 ).getAttributes() ) ).to.deep.equal( [ [ 'biz', 'bar' ] ] );
		} );

		it( 'should create and insert element with no attributes at the end of the parent', () => {
			const parent = writer.createDocumentFragment();

			writer.appendElement( 'foo', null, parent );

			expect( parent.childCount ).to.equal( 1 );
			expect( parent.getChild( 0 ).name ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [] );
		} );

		it( 'should create and insert element with no attributes omitting attributes param', () => {
			const parent = writer.createDocumentFragment();

			writer.appendElement( 'foo', parent );

			expect( parent.childCount ).to.equal( 1 );
			expect( parent.getChild( 0 ).name ).to.equal( 'foo' );
			expect( Array.from( parent.getChild( 0 ).getAttributes() ) ).to.deep.equal( [] );
		} );

		it( 'should create proper delta and operation', () => {
			const parent = writer.createDocumentFragment();
			const spy = sinon.spy( model, 'applyOperation' );

			writer.appendElement( 'foo', parent );

			sinon.assert.calledOnce( spy );
			expect( spy.firstCall.args[ 0 ].type ).to.equal( 'insert' );
			expect( spy.firstCall.args[ 0 ].delta ).to.instanceof( InsertDelta ).to.not.instanceof( WeakInsertDelta );
			expect( spy.firstCall.args[ 0 ].delta.batch ).to.equal( batch );
		} );
	} );

	describe( 'setAttribute() / removeAttribute()', () => {
		let root, spy;

		beforeEach( () => {
			root = doc.createRoot();
		} );

		describe( 'change attribute on node', () => {
			let node, text;

			beforeEach( () => {
				node = writer.createElement( 'p', { a: 1 } );
				text = writer.createText( 'c', { a: 1 } );

				writer.append( node, root );
				writer.append( text, root );

				spy = sinon.spy( model, 'applyOperation' );
			} );

			describe( 'setAttribute', () => {
				it( 'should create the attribute on element', () => {
					writer.setAttribute( 'b', 2, node );
					expect( spy.callCount ).to.equal( 1 );
					expect( node.getAttribute( 'b' ) ).to.equal( 2 );
				} );

				it( 'should change the attribute of element', () => {
					writer.setAttribute( 'a', 2, node );
					expect( spy.callCount ).to.equal( 1 );
					expect( node.getAttribute( 'a' ) ).to.equal( 2 );
				} );

				it( 'should create the attribute on text node', () => {
					writer.setAttribute( 'b', 2, text );
					expect( spy.callCount ).to.equal( 1 );
					expect( root.getChild( 1 ).getAttribute( 'b' ) ).to.equal( 2 );
				} );

				it( 'should change the attribute of text node', () => {
					writer.setAttribute( 'a', 2, text );
					expect( spy.callCount ).to.equal( 1 );
					expect( root.getChild( 1 ).getAttribute( 'a' ) ).to.equal( 2 );
				} );

				it( 'should do nothing if the attribute value is the same', () => {
					writer.setAttribute( 'a', 1, node );
					expect( spy.callCount ).to.equal( 0 );
					expect( node.getAttribute( 'a' ) ).to.equal( 1 );
				} );
			} );

			describe( 'removeAttribute', () => {
				it( 'should remove the attribute from element', () => {
					writer.removeAttribute( 'a', node );
					expect( spy.callCount ).to.equal( 1 );
					expect( node.getAttribute( 'a' ) ).to.be.undefined;
				} );

				it( 'should remove the attribute from character', () => {
					writer.removeAttribute( 'a', text );
					expect( spy.callCount ).to.equal( 1 );
					expect( root.getChild( 1 ).getAttribute( 'a' ) ).to.be.undefined;
				} );

				it( 'should do nothing if the attribute is not set', () => {
					writer.removeAttribute( 'b', node );
					expect( spy.callCount ).to.equal( 0 );
				} );
			} );
		} );

		describe( 'change attribute on range', () => {
			beforeEach( () => {
				const element = writer.createElement( 'e', { a: 2 } );

				writer.appendText( 'xxx', { a: 1 }, root );
				writer.appendText( 'xxx', root );
				writer.appendText( 'xxx', { a: 1 }, root );
				writer.appendText( 'xxx', { a: 2 }, root );
				writer.appendText( 'xxx', root );
				writer.appendText( 'xxx', { a: 1 }, root );
				writer.appendText( 'xxx', element );
				writer.append( element, root );
				writer.appendText( 'xxx', root );

				spy = sinon.spy( model, 'applyOperation' );
			} );

			function getRange( startIndex, endIndex ) {
				return new Range(
					Position.createFromParentAndOffset( root, startIndex ),
					Position.createFromParentAndOffset( root, endIndex )
				);
			}

			function getChangesAttrsCount() {
				let totalNumber = 0;

				for ( const delta of writer.batch.deltas ) {
					for ( const operation of delta.operations ) {
						if ( operation.range ) {
							totalNumber += count( operation.range.getItems( { singleCharacters: true } ) );
						}
					}
				}

				return totalNumber;
			}

			function getCompressedAttrs() {
				// default: 111---111222---1112------
				const range = Range.createIn( root );

				return Array.from( range.getItems( { singleCharacters: true } ) )
					.map( item => item.getAttribute( 'a' ) || '-' )
					.join( '' );
			}

			describe( 'setAttribute', () => {
				it( 'should set the attribute on the range', () => {
					writer.setAttribute( 'a', 3, getRange( 3, 6 ) );
					expect( spy.callCount ).to.equal( 1 );
					expect( getChangesAttrsCount() ).to.equal( 3 );
					expect( getCompressedAttrs() ).to.equal( '111333111222---1112------' );
				} );

				it( 'should split the operations if parts of the range have different attributes', () => {
					writer.setAttribute( 'a', 3, getRange( 4, 14 ) );
					expect( spy.callCount ).to.equal( 4 );
					expect( getChangesAttrsCount() ).to.equal( 10 );
					expect( getCompressedAttrs() ).to.equal( '111-3333333333-1112------' );
				} );

				it( 'should split the operations if parts of the part of the range have the attribute', () => {
					writer.setAttribute( 'a', 2, getRange( 4, 14 ) );
					expect( spy.callCount ).to.equal( 3 );
					expect( getChangesAttrsCount() ).to.equal( 7 );
					expect( getCompressedAttrs() ).to.equal( '111-2222222222-1112------' );
				} );

				it( 'should strip the range if the beginning have the attribute', () => {
					writer.setAttribute( 'a', 1, getRange( 1, 5 ) );
					expect( spy.callCount ).to.equal( 1 );
					expect( getChangesAttrsCount() ).to.equal( 2 );
					expect( getCompressedAttrs() ).to.equal( '11111-111222---1112------' );
				} );

				it( 'should strip the range if the ending have the attribute', () => {
					writer.setAttribute( 'a', 1, getRange( 13, 17 ) );
					expect( spy.callCount ).to.equal( 1 );
					expect( getChangesAttrsCount() ).to.equal( 2 );
					expect( getCompressedAttrs() ).to.equal( '111---111222-111112------' );
				} );

				it( 'should do nothing if the range has attribute', () => {
					writer.setAttribute( 'a', 1, getRange( 0, 3 ) );
					expect( spy.callCount ).to.equal( 0 );
					expect( getCompressedAttrs() ).to.equal( '111---111222---1112------' );
				} );

				it( 'should not check range\'s start position node when creating operations', () => {
					const range = new Range(
						new Position( root, [ 18, 1 ] ),
						new Position( root, [ 19 ] )
					);

					writer.setAttribute( 'a', 1, range );
					expect( spy.callCount ).to.equal( 1 );
					expect( getChangesAttrsCount() ).to.equal( 2 );
					expect( getCompressedAttrs() ).to.equal( '111---111222---1112-11---' );
				} );

				it( 'should not change elements attribute if range contains closing tag', () => {
					const range = new Range(
						new Position( root, [ 18, 1 ] ),
						new Position( root, [ 21 ] )
					);

					writer.setAttribute( 'a', 1, range );
					expect( spy.callCount ).to.equal( 1 );
					expect( getChangesAttrsCount() ).to.equal( 4 );
					expect( getCompressedAttrs() ).to.equal( '111---111222---1112-1111-' );
				} );

				it( 'should not create an operation if the range contains only closing tag', () => {
					const range = new Range(
						new Position( root, [ 18, 3 ] ),
						new Position( root, [ 19 ] )
					);

					writer.setAttribute( 'a', 3, range );
					expect( spy.callCount ).to.equal( 0 );
					expect( getCompressedAttrs() ).to.equal( '111---111222---1112------' );
				} );

				it( 'should not create an operation if is collapsed', () => {
					writer.setAttribute( 'a', 1, getRange( 3, 3 ) );
					expect( spy.callCount ).to.equal( 0 );
					expect( getCompressedAttrs() ).to.equal( '111---111222---1112------' );
				} );

				it( 'should create a proper operations for the mixed range', () => {
					writer.setAttribute( 'a', 1, getRange( 0, 20 ) );
					expect( spy.callCount ).to.equal( 5 );
					expect( getChangesAttrsCount() ).to.equal( 14 );
					expect( getCompressedAttrs() ).to.equal( '11111111111111111111111--' );
				} );
			} );

			describe( 'removeAttribute', () => {
				it( 'should remove the attribute on the range', () => {
					writer.removeAttribute( 'a', getRange( 0, 2 ) );
					expect( spy.callCount ).to.equal( 1 );
					expect( getChangesAttrsCount() ).to.equal( 2 );
					expect( getCompressedAttrs() ).to.equal( '--1---111222---1112------' );
				} );

				it( 'should split the operations if parts of the range have different attributes', () => {
					writer.removeAttribute( 'a', getRange( 7, 11 ) );
					expect( spy.callCount ).to.equal( 2 );
					expect( getChangesAttrsCount() ).to.equal( 4 );
					expect( getCompressedAttrs() ).to.equal( '111---1----2---1112------' );
				} );

				it( 'should split the operations if parts of the part of the range have no attribute', () => {
					writer.removeAttribute( 'a', getRange( 1, 7 ) );
					expect( spy.callCount ).to.equal( 2 );
					expect( getChangesAttrsCount() ).to.equal( 3 );
					expect( getCompressedAttrs() ).to.equal( '1------11222---1112------' );
				} );

				it( 'should strip the range if the beginning have no attribute', () => {
					writer.removeAttribute( 'a', getRange( 4, 12 ) );
					expect( spy.callCount ).to.equal( 2 );
					expect( getChangesAttrsCount() ).to.equal( 6 );
					expect( getCompressedAttrs() ).to.equal( '111------------1112------' );
				} );

				it( 'should strip the range if the ending have no attribute', () => {
					writer.removeAttribute( 'a', getRange( 7, 15 ) );
					expect( spy.callCount ).to.equal( 2 );
					expect( getChangesAttrsCount() ).to.equal( 5 );
					expect( getCompressedAttrs() ).to.equal( '111---1--------1112------' );
				} );

				it( 'should do nothing if the range has no attribute', () => {
					writer.removeAttribute( 'a', getRange( 4, 5 ) );
					expect( spy.callCount ).to.equal( 0 );
					expect( getCompressedAttrs() ).to.equal( '111---111222---1112------' );
				} );

				it( 'should not check range\'s start position node when creating operations', () => {
					const range = new Range(
						new Position( root, [ 18, 3 ] ),
						new Position( root, [ 19 ] )
					);

					writer.removeAttribute( 'a', range );
					expect( spy.callCount ).to.equal( 0 );
					expect( getChangesAttrsCount() ).to.equal( 0 );
					expect( getCompressedAttrs() ).to.equal( '111---111222---1112------' );
				} );

				it( 'should not apply operation twice in the range contains opening and closing tags', () => {
					writer.removeAttribute( 'a', getRange( 18, 22 ) );
					expect( spy.callCount ).to.equal( 1 );
					expect( getChangesAttrsCount() ).to.equal( 1 );
					expect( getCompressedAttrs() ).to.equal( '111---111222---111-------' );
				} );

				it( 'should not create an operation if range is collapsed', () => {
					writer.removeAttribute( 'a', getRange( 3, 3 ) );
					expect( spy.callCount ).to.equal( 0 );
					expect( getCompressedAttrs() ).to.equal( '111---111222---1112------' );
				} );

				it( 'should create a proper operations for the mixed range', () => {
					writer.removeAttribute( 'a', getRange( 3, 15 ) );
					expect( spy.callCount ).to.equal( 2 );
					expect( getChangesAttrsCount() ).to.equal( 6 );
					expect( getCompressedAttrs() ).to.equal( '111------------1112------' );
				} );
			} );
		} );

		describe( 'change attribute on root element', () => {
			let p;

			beforeEach( () => {
				p = writer.createElement( 'p', { a: 3 } );
				spy = sinon.spy( model, 'applyOperation' );
			} );

			describe( 'setAttribute', () => {
				it( 'should create the attribute on root', () => {
					writer.setAttribute( 'b', 2, root );
					expect( spy.callCount ).to.equal( 1 );
					expect( root.getAttribute( 'b' ) ).to.equal( 2 );
				} );

				it( 'should create the attribute on detached root', () => {
					writer.setAttribute( 'b', 2, p );
					expect( spy.callCount ).to.equal( 1 );
					expect( p.getAttribute( 'b' ) ).to.equal( 2 );
				} );

				it( 'should change the attribute of root', () => {
					writer.setAttribute( 'a', 2, root );
					expect( spy.callCount ).to.equal( 1 );
					expect( root.getAttribute( 'a' ) ).to.equal( 2 );
				} );

				it( 'should change the attribute of detached root', () => {
					writer.setAttribute( 'a', 2, p );
					expect( spy.callCount ).to.equal( 1 );
					expect( p.getAttribute( 'a' ) ).to.equal( 2 );
				} );

				it( 'should do nothing if the attribute value is the same', () => {
					writer.setAttribute( 'a', 1, root );
					expect( spy.callCount ).to.equal( 1 );
					writer.setAttribute( 'a', 1, root );
					expect( spy.callCount ).to.equal( 1 );
					expect( root.getAttribute( 'a' ) ).to.equal( 1 );
				} );

				it( 'should do nothing if the attribute value is the same on detached root', () => {
					writer.setAttribute( 'a', 1, p );
					expect( spy.callCount ).to.equal( 1 );
					writer.setAttribute( 'a', 1, p );
					expect( spy.callCount ).to.equal( 1 );
					expect( p.getAttribute( 'a' ) ).to.equal( 1 );
				} );
			} );

			describe( 'removeAttribute', () => {
				it( 'should remove the attribute from root', () => {
					writer.setAttribute( 'a', 1, root );
					writer.removeAttribute( 'a', root );

					expect( spy.callCount ).to.equal( 2 );
					expect( root.getAttribute( 'a' ) ).to.be.undefined;
				} );

				it( 'should do nothing if the attribute is not set', () => {
					writer.removeAttribute( 'b', root );
					expect( spy.callCount ).to.equal( 0 );
				} );
			} );

			describe( 'clearAttributes', () => {
				it( 'should clear attributes from range', () => {
					writer.appendText( 'xxx', { a: 1, b: 2, c: 3 }, root );
					writer.appendText( 'xxx', root );
					writer.appendText( 'xxx', { a: 1 }, root );
					writer.appendText( 'xxx', { b: 2 }, root );
					writer.appendText( 'xxx', root );
					writer.appendElement( 'e', { a: 1 }, root );
					writer.appendText( 'xxx', root );

					const range = Range.createIn( root );

					writer.clearAttributes( range );

					let itemsCount = 0;

					for ( const item of range.getItems() ) {
						itemsCount++;
						expect( Array.from( item.getAttributeKeys() ).length ).to.equal( 0 );
					}

					expect( itemsCount ).to.equal( 3 );
				} );

				it( 'should clear attributes on element', () => {
					const element = writer.createElement( 'x', { a: 1, b: 2, c: 3 }, root );

					expect( Array.from( element.getAttributeKeys() ).length ).to.equal( 3 );

					writer.clearAttributes( element );

					expect( Array.from( element.getAttributeKeys() ).length ).to.equal( 0 );
				} );

				it( 'should clear attributes on root element', () => {
					writer.setAttributes( { a: 1, b: 2, c: 3 }, root );

					expect( Array.from( root.getAttributeKeys() ).length ).to.equal( 3 );

					writer.clearAttributes( root );

					expect( Array.from( root.getAttributeKeys() ).length ).to.equal( 0 );
				} );

				it( 'should do nothing if there are no attributes', () => {
					const element = writer.createElement( 'x' );

					expect( Array.from( element.getAttributeKeys() ).length ).to.equal( 0 );

					writer.clearAttributes( element );

					expect( Array.from( element.getAttributeKeys() ).length ).to.equal( 0 );
				} );
			} );
		} );

		it( 'should not add empty delta to the batch', () => {
			const nodeA = new Element( 'p', { a: 1 } );
			const nodeB = new Element( 'p', { b: 2 } );
			root.insertChildren( 0, [ nodeA, nodeB ] );

			writer.setAttribute( 'a', 1, nodeA );

			expect( writer.batch.deltas.length ).to.equal( 0 );

			writer.removeAttribute( 'x', Range.createIn( root ) );

			expect( writer.batch.deltas.length ).to.equal( 0 );
		} );
	} );

	describe( 'setAttributes()', () => {
		let frag, item;

		beforeEach( () => {
			frag = writer.createDocumentFragment();
			item = writer.createText( 'xxx', { b: 2, c: 3 } );

			writer.appendText( 'xxx', { a: 1 }, frag );
			writer.append( item, frag );
		} );

		it( 'should set attributes one by one on range', () => {
			const range = Range.createIn( frag );

			// `setAttribute` is a not trivial operation and is deeply tested above, there is no point to duplicate
			// such a big amount of the same tests, so let's use a spy here.
			const spy = sinon.spy( writer, 'setAttribute' );

			writer.setAttributes( { a: 3, c: null }, range );

			// Verify result.
			expect( Array.from( frag.getChild( 0 ).getAttributes() ) ).to.deep.equal( [ [ 'a', 3 ] ] );
			expect( Array.from( frag.getChild( 1 ).getAttributes() ) ).to.deep.equal( [ [ 'b', 2 ], [ 'a', 3 ] ] );

			// Verify operations
			sinon.assert.calledTwice( spy );
			sinon.assert.calledWith( spy.firstCall, 'a', 3, range );
			sinon.assert.calledWith( spy.secondCall, 'c', null, range );
		} );

		it( 'should set attributes one by one on range for map as attributes list', () => {
			const range = Range.createIn( frag );

			// `setAttribute` is a not trivial operation and is deeply tested above, there is no point to duplicate
			// such a big amount of the same tests, so let's use a spy here.
			const spy = sinon.spy( writer, 'setAttribute' );

			writer.setAttributes( new Map( [ [ 'a', 3 ], [ 'c', null ] ] ), range );

			// Verify result.
			expect( Array.from( frag.getChild( 0 ).getAttributes() ) ).to.deep.equal( [ [ 'a', 3 ] ] );
			expect( Array.from( frag.getChild( 1 ).getAttributes() ) ).to.deep.equal( [ [ 'b', 2 ], [ 'a', 3 ] ] );

			// Verify operations
			sinon.assert.calledTwice( spy );
			sinon.assert.calledWith( spy.firstCall, 'a', 3, range );
			sinon.assert.calledWith( spy.secondCall, 'c', null, range );
		} );

		it( 'should set attributes one by one on item', () => {
			// `setAttribute` is a not trivial operation and is deeply tested above, there is no point to duplicate
			// such a big amount of the same tests, so let's use a spy here.
			const spy = sinon.spy( writer, 'setAttribute' );

			writer.setAttributes( { a: 3, c: null }, item );

			// Verify result.
			expect( Array.from( item.getAttributes() ) ).to.deep.equal( [ [ 'b', 2 ], [ 'a', 3 ] ] );

			// Verify operations
			sinon.assert.calledTwice( spy );
			sinon.assert.calledWith( spy.firstCall, 'a', 3, item );
			sinon.assert.calledWith( spy.secondCall, 'c', null, item );
		} );

		it( 'should set attributes one by one on item for maps as attributes list', () => {
			// `setAttribute` is a not trivial operation and is deeply tested above, there is no point to duplicate
			// such a big amount of the same tests, so let's use a spy here.
			const spy = sinon.spy( writer, 'setAttribute' );

			writer.setAttributes( new Map( [ [ 'a', 3 ], [ 'c', null ] ] ), item );

			// Verify result.
			expect( Array.from( item.getAttributes() ) ).to.deep.equal( [ [ 'b', 2 ], [ 'a', 3 ] ] );

			// Verify operations
			sinon.assert.calledTwice( spy );
			sinon.assert.calledWith( spy.firstCall, 'a', 3, item );
			sinon.assert.calledWith( spy.secondCall, 'c', null, item );
		} );
	} );

	describe( 'merge()', () => {
		let root, p1, p2;

		beforeEach( () => {
			root = doc.createRoot();

			p1 = new Element( 'p', { key1: 'value1' }, new Text( 'foo' ) );
			p2 = new Element( 'p', { key2: 'value2' }, new Text( 'bar' ) );

			root.insertChildren( 0, [ p1, p2 ] );
		} );

		it( 'should merge foo and bar into foobar', () => {
			writer.merge( new Position( root, [ 1 ] ) );

			expect( root.maxOffset ).to.equal( 1 );
			expect( root.getChild( 0 ).name ).to.equal( 'p' );
			expect( root.getChild( 0 ).maxOffset ).to.equal( 6 );
			expect( count( root.getChild( 0 ).getAttributes() ) ).to.equal( 1 );
			expect( root.getChild( 0 ).getAttribute( 'key1' ) ).to.equal( 'value1' );
			expect( root.getChild( 0 ).getChild( 0 ).data ).to.equal( 'foobar' );
		} );

		it( 'should correctly merge in document fragment', () => {
			const docFrag = new DocumentFragment( [
				new Element( 'p', null, 'foo' ),
				new Element( 'p', null, 'bar' )
			] );

			writer.merge( new Position( docFrag, [ 1 ] ) );

			expect( docFrag.getChild( 0 ).name ).to.equal( 'p' );
			expect( docFrag.getChild( 0 ).getChild( 0 ).data ).to.equal( 'foobar' );
		} );

		it( 'should throw if there is no element after', () => {
			expect( () => {
				writer.merge( new Position( root, [ 2 ] ) );
			} ).to.throw( CKEditorError, /^writer-merge-no-element-after/ );
		} );

		it( 'should throw if there is no element before', () => {
			expect( () => {
				writer.merge( new Position( root, [ 0, 2 ] ) );
			} ).to.throw( CKEditorError, /^writer-merge-no-element-before/ );
		} );
	} );

	describe( 'move()', () => {
		let root, range, div, p;

		beforeEach( () => {
			root = doc.createRoot();

			div = new Element( 'div', [], new Text( 'foobar' ) );
			p = new Element( 'p', [], new Text( 'abcxyz' ) );

			div.insertChildren( 0, [ new Element( 'p', [], new Text( 'gggg' ) ) ] );
			div.insertChildren( 2, [ new Element( 'p', [], new Text( 'hhhh' ) ) ] );

			root.insertChildren( 0, [ div, p ] );

			range = new Range( new Position( root, [ 0, 3 ] ), new Position( root, [ 0, 7 ] ) );
		} );

		it( 'should move flat range of nodes', () => {
			writer.move( range, new Position( root, [ 1, 3 ] ) );

			expect( getNodesAndText( Range.createIn( root.getChild( 0 ) ) ) ).to.equal( 'PggggPfoPhhhhP' );
			expect( getNodesAndText( Range.createIn( root.getChild( 1 ) ) ) ).to.equal( 'abcobarxyz' );
		} );

		it( 'should throw if object to move is not a range', () => {
			expect( () => {
				writer.move( root.getChild( 0 ), new Position( root, [ 1, 3 ] ) );
			} ).to.throw( CKEditorError, /^writer-move-invalid-range/ );
		} );

		it( 'should throw if given range is not flat', () => {
			const notFlatRange = new Range( new Position( root, [ 0, 2, 2 ] ), new Position( root, [ 0, 6 ] ) );

			expect( () => {
				writer.move( notFlatRange, new Position( root, [ 1, 3 ] ) );
			} ).to.throw( CKEditorError, /^writer-move-range-not-flat/ );
		} );

		it( 'should throw if range is going to be moved to the other document', () => {
			const docFrag = writer.createDocumentFragment();

			expect( () => {
				writer.move( range, docFrag );
			} ).to.throw( CKEditorError, /^writer-move-different-document/ );
		} );
	} );

	describe( 'remove()', () => {
		let div, p, range;

		beforeEach( () => {
			div = writer.createElement( 'div' );
			writer.appendText( 'foobar', div );

			p = writer.createElement( 'p' );
			writer.appendText( 'abcxyz', p );

			writer.insertElement( 'p', div );
			writer.appendElement( 'p', div );

			writer.insertText( 'gggg', new Position( div, [ 0, 0 ] ) );
			writer.insertText( 'hhhh', new Position( div, [ 7, 0 ] ) );
		} );

		describe( 'remove from document', () => {
			let root;

			beforeEach( () => {
				root = doc.createRoot();
				writer.append( div, root );
				writer.append( p, root );

				// Reset batch inside a writer.
				batch = new Batch();
				writer = new Writer( model, batch );

				// Range starts in ROOT > DIV > P > gg|gg.
				// Range ends in ROOT > DIV > ...|ar.
				range = new Range( new Position( root, [ 0, 0, 2 ] ), new Position( root, [ 0, 5 ] ) );
			} );

			it( 'should remove specified node', () => {
				writer.remove( div );

				expect( root.maxOffset ).to.equal( 1 );
				expect( root.childCount ).to.equal( 1 );
				expect( getNodesAndText( Range.createIn( root.getChild( 0 ) ) ) ).to.equal( 'abcxyz' );
			} );

			it( 'should remove specified text node', () => {
				writer.remove( p.getChild( 0 ) );

				expect( getNodesAndText( Range.createOn( p ) ) ).to.equal( 'PP' );
			} );

			it( 'should remove any range of nodes', () => {
				writer.remove( range );

				expect( getNodesAndText( Range.createIn( root.getChild( 0 ) ) ) ).to.equal( 'PggParPhhhhP' );
				expect( getNodesAndText( Range.createIn( root.getChild( 1 ) ) ) ).to.equal( 'abcxyz' );
			} );

			it( 'should create minimal number of remove deltas, each with only one operation', () => {
				writer.remove( range );

				expect( writer.batch.deltas.length ).to.equal( 2 );
				expect( writer.batch.deltas[ 0 ].operations.length ).to.equal( 1 );
				expect( writer.batch.deltas[ 1 ].operations.length ).to.equal( 1 );
			} );

			it( 'should use RemoveOperation', () => {
				writer.remove( div );

				expect( writer.batch.deltas[ 0 ].operations[ 0 ].type ).to.equal( 'remove' );
			} );
		} );

		describe( 'remove from document fragment', () => {
			let frag;

			beforeEach( () => {
				frag = writer.createDocumentFragment();
				writer.append( div, frag );
				writer.append( p, frag );

				// Reset batch in writer.
				batch = new Batch();
				writer = new Writer( model, batch );

				// Range starts in FRAG > DIV > P > gg|gg.
				// Range ends in FRAG > DIV > ...|ar.
				range = new Range( new Position( frag, [ 0, 0, 2 ] ), new Position( frag, [ 0, 5 ] ) );
			} );

			it( 'should remove specified node', () => {
				writer.remove( div );

				expect( frag.maxOffset ).to.equal( 1 );
				expect( frag.childCount ).to.equal( 1 );
				expect( getNodesAndText( Range.createIn( frag.getChild( 0 ) ) ) ).to.equal( 'abcxyz' );
			} );

			it( 'should remove specified text node', () => {
				writer.remove( p.getChild( 0 ) );

				expect( getNodesAndText( Range.createOn( p ) ) ).to.equal( 'PP' );
			} );

			it( 'should remove any range of nodes', () => {
				writer.remove( range );

				expect( getNodesAndText( Range.createIn( frag.getChild( 0 ) ) ) ).to.equal( 'PggParPhhhhP' );
				expect( getNodesAndText( Range.createIn( frag.getChild( 1 ) ) ) ).to.equal( 'abcxyz' );
			} );

			it( 'should create minimal number of remove deltas, each with only one operation', () => {
				writer.remove( range );

				expect( writer.batch.deltas.length ).to.equal( 2 );
				expect( writer.batch.deltas[ 0 ].operations.length ).to.equal( 1 );
				expect( writer.batch.deltas[ 1 ].operations.length ).to.equal( 1 );
			} );

			it( 'should use DetachOperation', () => {
				writer.remove( div );

				expect( writer.batch.deltas[ 0 ].operations[ 0 ].type ).to.equal( 'detach' );
			} );
		} );
	} );

	describe( 'rename()', () => {
		it( 'should rename given element', () => {
			const root = doc.createRoot();
			const p = new Element( 'p', null, new Text( 'abc' ) );

			root.appendChildren( p );

			writer.rename( p, 'h' );

			expect( root.maxOffset ).to.equal( 1 );
			expect( root.getChild( 0 ) ).to.have.property( 'name', 'h' );
		} );

		it( 'should rename in document fragment', () => {
			const docFrag = new DocumentFragment();
			const p = new Element( 'p' );

			docFrag.appendChildren( p );

			writer.rename( p, 'h' );

			expect( docFrag.maxOffset ).to.equal( 1 );
			expect( docFrag.getChild( 0 ) ).to.have.property( 'name', 'h' );
		} );

		it( 'should throw if not an Element instance is passed', () => {
			expect( () => {
				writer.rename( new Text( 'abc' ), 'h' );
			} ).to.throw( CKEditorError, /^writer-rename-not-element-instance/ );
		} );
	} );

	describe( 'split()', () => {
		let root, p;

		beforeEach( () => {
			root = doc.createRoot();

			p = new Element( 'p', { key: 'value' }, new Text( 'foobar' ) );

			root.insertChildren( 0, p );
		} );

		it( 'should split foobar to foo and bar', () => {
			writer.split( new Position( root, [ 0, 3 ] ) );

			expect( root.maxOffset ).to.equal( 2 );

			expect( root.getChild( 0 ).name ).to.equal( 'p' );
			expect( root.getChild( 0 ).maxOffset ).to.equal( 3 );
			expect( count( root.getChild( 0 ).getAttributes() ) ).to.equal( 1 );
			expect( root.getChild( 0 ).getAttribute( 'key' ) ).to.equal( 'value' );
			expect( root.getChild( 0 ).getChild( 0 ).data ).to.equal( 'foo' );

			expect( root.getChild( 1 ).name ).to.equal( 'p' );
			expect( root.getChild( 1 ).maxOffset ).to.equal( 3 );
			expect( count( root.getChild( 1 ).getAttributes() ) ).to.equal( 1 );
			expect( root.getChild( 1 ).getAttribute( 'key' ) ).to.equal( 'value' );
			expect( root.getChild( 1 ).getChild( 0 ).data ).to.equal( 'bar' );
		} );

		it( 'should split inside document fragment', () => {
			const docFrag = new DocumentFragment();
			docFrag.appendChildren( new Element( 'p', null, new Text( 'foobar' ) ) );

			writer.split( new Position( docFrag, [ 0, 3 ] ) );

			expect( docFrag.maxOffset ).to.equal( 2 );

			expect( docFrag.getChild( 0 ).name ).to.equal( 'p' );
			expect( docFrag.getChild( 0 ).maxOffset ).to.equal( 3 );
			expect( docFrag.getChild( 0 ).getChild( 0 ).data ).to.equal( 'foo' );

			expect( docFrag.getChild( 1 ).name ).to.equal( 'p' );
			expect( docFrag.getChild( 1 ).maxOffset ).to.equal( 3 );
			expect( docFrag.getChild( 1 ).getChild( 0 ).data ).to.equal( 'bar' );
		} );

		it( 'should create an empty paragraph if we split at the end', () => {
			writer.split( new Position( root, [ 0, 6 ] ) );

			expect( root.maxOffset ).to.equal( 2 );

			expect( root.getChild( 0 ).name ).to.equal( 'p' );
			expect( root.getChild( 0 ).maxOffset ).to.equal( 6 );
			expect( count( root.getChild( 0 ).getAttributes() ) ).to.equal( 1 );
			expect( root.getChild( 0 ).getAttribute( 'key' ) ).to.equal( 'value' );
			expect( root.getChild( 0 ).getChild( 0 ).data ).to.equal( 'foobar' );

			expect( root.getChild( 1 ).name ).to.equal( 'p' );
			expect( root.getChild( 1 ).maxOffset ).to.equal( 0 );
			expect( count( root.getChild( 1 ).getAttributes() ) ).to.equal( 1 );
			expect( root.getChild( 1 ).getAttribute( 'key' ) ).to.equal( 'value' );
		} );

		it( 'should throw if we try to split a root', () => {
			expect( () => {
				writer.split( new Position( root, [ 0 ] ) );
			} ).to.throw( CKEditorError, /^writer-split-element-no-parent/ );
		} );

		it( 'should throw if we try to split an element with no parent', () => {
			expect( () => {
				const element = writer.createElement( 'p' );

				writer.split( new Position( element, [ 0 ] ) );
			} ).to.throw( CKEditorError, /^writer-split-element-no-parent/ );
		} );

		it( 'should throw if we try to split a document fragment', () => {
			expect( () => {
				const documentFragment = writer.createDocumentFragment();

				writer.split( new Position( documentFragment, [ 0 ] ) );
			} ).to.throw( CKEditorError, /^writer-split-element-no-parent/ );
		} );
	} );

	describe( 'wrap()', () => {
		let root, range;

		beforeEach( () => {
			root = doc.createRoot();

			root.insertChildren( 0, new Text( 'foobar' ) );

			range = new Range( new Position( root, [ 2 ] ), new Position( root, [ 4 ] ) );
		} );

		it( 'should wrap flat range with given element', () => {
			const p = new Element( 'p' );
			writer.wrap( range, p );

			expect( root.maxOffset ).to.equal( 5 );
			expect( root.getChild( 0 ).data ).to.equal( 'fo' );
			expect( root.getChild( 1 ) ).to.equal( p );
			expect( p.getChild( 0 ).data ).to.equal( 'ob' );
			expect( root.getChild( 2 ).data ).to.equal( 'ar' );
		} );

		it( 'should wrap flat range with an element of given name', () => {
			writer.wrap( range, 'p' );

			expect( root.maxOffset ).to.equal( 5 );
			expect( root.getChild( 0 ).data ).to.equal( 'fo' );
			expect( root.getChild( 1 ).name ).to.equal( 'p' );
			expect( root.getChild( 1 ).getChild( 0 ).data ).to.equal( 'ob' );
			expect( root.getChild( 2 ).data ).to.equal( 'ar' );
		} );

		it( 'should wrap inside document fragment', () => {
			const docFrag = new DocumentFragment( new Text( 'foo' ) );

			writer.wrap( Range.createIn( docFrag ), 'p' );

			expect( docFrag.maxOffset ).to.equal( 1 );
			expect( docFrag.getChild( 0 ).name ).to.equal( 'p' );
			expect( docFrag.getChild( 0 ).getChild( 0 ).data ).to.equal( 'foo' );
		} );

		it( 'should throw if range to wrap is not flat', () => {
			root.insertChildren( 1, [ new Element( 'p', [], new Text( 'xyz' ) ) ] );
			const notFlatRange = new Range( new Position( root, [ 3 ] ), new Position( root, [ 6, 2 ] ) );

			expect( () => {
				writer.wrap( notFlatRange, 'p' );
			} ).to.throw( CKEditorError, /^writer-wrap-range-not-flat/ );
		} );

		it( 'should throw if element to wrap with has children #1', () => {
			const p = new Element( 'p', [], new Text( 'a' ) );

			expect( () => {
				writer.wrap( range, p );
			} ).to.throw( CKEditorError, /^writer-wrap-element-not-empty/ );
		} );

		it( 'should throw if element to wrap with has children #2', () => {
			const p = new Element( 'p' );
			root.insertChildren( 0, p );

			expect( () => {
				writer.wrap( range, p );
			} ).to.throw( CKEditorError, /^writer-wrap-element-attached/ );
		} );
	} );

	describe( 'unwrap()', () => {
		let root, p;

		beforeEach( () => {
			root = doc.createRoot();

			p = new Element( 'p', [], new Text( 'xyz' ) );
			root.insertChildren( 0, [ new Text( 'a' ), p, new Text( 'b' ) ] );
		} );

		it( 'should unwrap given element', () => {
			writer.unwrap( p );

			expect( root.maxOffset ).to.equal( 5 );
			expect( root.getChild( 0 ).data ).to.equal( 'axyzb' );
		} );

		it( 'should unwrap inside document fragment', () => {
			const docFrag = new DocumentFragment( new Element( 'p', null, new Text( 'foo' ) ) );

			writer.unwrap( docFrag.getChild( 0 ) );

			expect( docFrag.maxOffset ).to.equal( 3 );
			expect( docFrag.getChild( 0 ).data ).to.equal( 'foo' );
		} );

		it( 'should throw if element to unwrap has no parent', () => {
			const element = new Element( 'p' );

			expect( () => {
				writer.unwrap( element );
			} ).to.throw( CKEditorError, /^writer-unwrap-element-no-parent/ );
		} );
	} );

	describe( 'setMarker()', () => {
		let root, range;

		beforeEach( () => {
			root = doc.createRoot();
			root.appendChildren( new Text( 'foo' ) );
			range = Range.createIn( root );
		} );

		it( 'should add marker to the document marker collection', () => {
			writer.setMarker( 'name', range );

			expect( model.markers.get( 'name' ).getRange().isEqual( range ) ).to.be.true;
		} );

		it( 'should update marker in the document marker collection', () => {
			writer.setMarker( 'name', range );

			const range2 = Range.createFromParentsAndOffsets( root, 0, root, 0 );
			writer.setMarker( 'name', range2 );

			expect( model.markers.get( 'name' ).getRange().isEqual( range2 ) ).to.be.true;
		} );

		it( 'should accept marker instance', () => {
			const marker = model.markers.set( 'name', range );
			const range2 = Range.createFromParentsAndOffsets( root, 0, root, 0 );

			writer.setMarker( marker, range2 );
			const op = writer.batch.deltas[ 0 ].operations[ 0 ];

			expect( model.markers.get( 'name' ).getRange().isEqual( range2 ) ).to.be.true;
			expect( op.oldRange.isEqual( range ) ).to.be.true;
			expect( op.newRange.isEqual( range2 ) ).to.be.true;
		} );

		it( 'should accept empty range parameter if marker instance is passed', () => {
			const marker = model.markers.set( 'name', range );
			const spy = sinon.spy();

			model.on( 'applyOperation', spy );

			writer.setMarker( marker );
			const op = writer.batch.deltas[ 0 ].operations[ 0 ];

			expect( spy.calledOnce ).to.be.true;
			expect( spy.firstCall.args[ 1 ][ 0 ].type ).to.equal( 'marker' );
			expect( op.oldRange ).to.be.null;
			expect( op.newRange.isEqual( range ) ).to.be.true;
		} );

		it( 'should throw if marker with given name does not exist and range is not passed', () => {
			expect( () => {
				writer.setMarker( 'name' );
			} ).to.throw( CKEditorError, /^writer-setMarker-no-range/ );
		} );
	} );

	describe( 'removeMarker()', () => {
		let root, range;

		beforeEach( () => {
			root = doc.createRoot();
			root.appendChildren( new Text( 'foo' ) );
			range = Range.createIn( root );
		} );

		it( 'should remove marker from the document marker collection', () => {
			writer.setMarker( 'name', range );
			writer.removeMarker( 'name' );

			expect( model.markers.get( 'name' ) ).to.be.null;
		} );

		it( 'should throw when trying to remove non existing marker', () => {
			expect( () => {
				writer.removeMarker( 'name' );
			} ).to.throw( CKEditorError, /^writer-removeMarker-no-marker/ );
		} );

		it( 'should accept marker instance', () => {
			writer.setMarker( 'name', range );
			const marker = model.markers.get( 'name' );

			writer.removeMarker( marker );

			expect( model.markers.get( 'name' ) ).to.be.null;
		} );
	} );
} );
