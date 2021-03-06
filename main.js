import deepFreeze from 'deep-freeze'
import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers } from 'redux'
import { Provider, connect } from 'react-redux'
import expect, { createSpy, spyOn, isSpy } from 'expect'

const Todo = ({
    onClick,
    completed,
    text
}) => (
    <li
        onClick={onClick}
        style={{
        textDecoration: completed ? 'line-through' : 'none'
        }}
    >
        {text}
    </li>
)

const TodoList = ({
    todos,
    onTodoClick
}) => (
    <ul>
        {
            todos.map(todo =>
                <Todo
                    key={todo.id}
                    {...todo}
                    onClick={() => onTodoClick(todo.id)}
                />
            )
        }
    </ul>
)

const todo = (state = {}, action) => {
    switch (action.type) {
        case 'ADD_TODO':
            return  {
                id: action.id,
                text: action.text,
                completed: false
            }
        case 'TOGGLE_TODO':
            if( state.id !== action.id ) {
                return state;
            }
            return Object.assign({}, state, {completed: !state.completed});
        default:
            return state;
    }
}

let AddTodo = ({ dispatch }) => {
    let input;
    return (
        <div>
            <input ref={node => {
                    input = node;
                }}></input>
            <button onClick={() => {
                dispatch({
                    type: 'ADD_TODO',
                    text: input.value,
                    id: nextTodoId++
                });
                input.value = '';
            }}
            >
                ADD TODO
            </button>
        </div>
    )
}

AddTodo = connect()(AddTodo);

const Footer = ({
    store
}) => (
    <p>
        Show:
        {' '}
        <FilterLink
            filter='SHOW_ALL'
        >
            All
        </FilterLink>
        <FilterLink
            filter='SHOW_ACTIVE'
        >
            Active
        </FilterLink>
        <FilterLink
            filter='SHOW_COMPLETED'
        >
            Completed
        </FilterLink>
    </p>
)

const todos = (state = [], action) => {
    switch(action.type) {
        case 'ADD_TODO':
            return [
                ...state,
                todo(undefined, action)
            ]

        case 'TOGGLE_TODO':
            return state.map(t => todo(t, action));
        default:
            return state
    }
};

const visibilityFilter = (state = 'SHOW_ALL', action) => {
    switch(action.type) {
        case 'SET_VISIBILITY_FILTER':
            return action.filter
        default:
            return state;
    }
}

const todosReduce = combineReducers({
    todos,
    visibilityFilter
});

const { Component } = React;

let nextTodoId = 0;

const getVisibleTodos = (todos, filter) => {
    switch(filter) {
        case 'SHOW_ALL':
            return todos;
        case 'SHOW_COMPLETED':
            return todos.filter(todo => todo.completed)
        case 'SHOW_ACTIVE':
            return todos.filter(todo => !todo.completed)
    }
}


const Link = ({
    active,
    children,
    onClick
}) => {

    if(active) {
        return <span>{children}</span>;
    }

    return (
        <a href="#"
           onClick={(e) => {
            e.preventDefault();
            onClick();
           }}
        >
            {children}
        </a>
    )
}

class FilterLink extends Component {
    componentDidMount() {
        const { store } = this.context;
        this.unsubscribe = store.subscribe( () => {
            this.forceUpdate();
        })
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    render() {
        const props = this.props;
        const { store } = this.context;
        const state = store.getState();

        return (
            <Link
                active={props.active}
                onClick={
                        () => {
                        store.dispatch({
                            type: 'SET_VISIBILITY_FILTER',
                            filter: props.filter
                        })
                    }
                }

            >
                {props.children}
            </Link>
        )
    }
}

FilterLink.contextTypes = {
    store: React.PropTypes.object
}

// class VisibleTodoList extends Component {
//
//     componentDidMount() {
//         const { store } = this.context;
//         this.unsubscribe = store.subscribe( () => {
//             this.forceUpdate();
//         })
//     }
//
//     componentWillUnmount() {
//         this.unsubscribe();
//     }
//
//     render() {
//         const props = this.props;
//         const { store } = this.context;
//         const state = store.getState();
//
//         return (
//             <TodoList
//                 todos={}
//                 onTodoClick={}
//             />
//         )
//     }
// }

// VisibleTodoList.contextTypes = {
//     store: React.PropTypes.object
// };

const TodoApp = () => {
    return (
        <div>
            <AddTodo/>
            <VisibleTodoList/>
            <Footer/>
        </div>
    )
}

const mapStateToTodoListProps = (state) => {
    return {
        todos: getVisibleTodos(
            state.todos,
            state.visibilityFilter
        )
    }
}

const mapDispatchToTodoListProps = (dispatch) => {
    return {
        onTodoClick: (id) => {
            dispatch({type: 'TOGGLE_TODO', id})
        }
    }
}

const VisibleTodoList = connect(
    mapStateToTodoListProps,
    mapDispatchToTodoListProps
)(TodoList);


ReactDOM.render(
    <Provider  store={createStore(todosReduce, window.devToolsExtension && window.devToolsExtension())}>
        <TodoApp/>
    </Provider>,
    document.getElementById('root')
);


