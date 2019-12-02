import React, {Component} from 'react'
import PropTypes from 'prop-types'
// TODO: if we can get this out then we can drop domkit!
// All this keyframing/animation and platform dependent stuff should go away into scss
import insertKeyframesRule from 'domkit/insertKeyframesRule'

const animation = {
  show: {
    animationDuration: '0.3s',
    animationTimingFunction: 'ease-out',
  },
  hide: {
    animationDuration: '0.3s',
    animationTimingFunction: 'ease-out',
  },
  showContentAnimation: insertKeyframesRule({
    '0%': {
      opacity: 0,
    },
    '100%': {
      opacity: 1,
    },
  }),
  hideContentAnimation: insertKeyframesRule({
    '0%': {
      opacity: 1,
    },
    '100%': {
      opacity: 0,
    },
  }),
  showBackdropAnimation: insertKeyframesRule({
    '0%': {
      opacity: 0,
    },
    '100%': {
      opacity: 0.9,
    },
  }),
  hideBackdropAnimation: insertKeyframesRule({
    '0%': {
      opacity: 0.9,
    },
    '100%': {
      opacity: 0,
    },
  }),
}

const endEvents = ['transitionend', 'animationend']

function addEventListener (node, eventName, eventListener) {
  node.addEventListener(eventName, eventListener, false)
}

function removeEventListener (node, eventName, eventListener) {
  node.removeEventListener(eventName, eventListener, false)
}

const removeEndEventListener = (node, eventListener) => {
  if (endEvents.length === 0) {
    return
  }
  endEvents.forEach(function (endEvent) {
    removeEventListener(node, endEvent, eventListener)
  })
}

const addEndEventListener = (node, eventListener) => {
  if (endEvents.length === 0) {
    // If CSS transitions are not supported, trigger an "end animation"
    // event immediately.
    window.setTimeout(eventListener, 0)
    return
  }
  endEvents.forEach(function (endEvent) {
    addEventListener(node, endEvent, eventListener)
  })
}

class FadeModal extends Component {
  constructor (props) {
    super(props)
    this.content = null
  }

  static propTypes = {
    animation: PropTypes.object,
    backdrop: PropTypes.bool,
    backdropStyle: PropTypes.object,
    className: PropTypes.string,
    closeOnClick: PropTypes.bool,
    contentStyle: PropTypes.object,
    keyboard: PropTypes.bool,
    modalStyle: PropTypes.object,
    onShow: PropTypes.func,
    onHide: PropTypes.func,
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),
  }

  static defaultProps = {
    className: '',
    onShow: function () {},
    onHide: function () {},
    animation: animation,
    keyboard: true,
    backdrop: true,
    closeOnClick: true,
    modalStyle: {},
    backdropStyle: {},
    contentStyle: {},
    children: [],
  }

  state = {
    willHide: true,
    hidden: true,
  }

  addTransitionListener = (node, handle) => {
    if (node) {
      var endListener = function (e) {
        if (e && e.target !== node) {
          return
        }
        removeEndEventListener(node, endListener)
        handle()
      }
      addEndEventListener(node, endListener)
    }
  }

  handleBackdropClick = () => {
    if (this.props.closeOnClick) {
      this.hide()
    }
  }

  hasHidden = () => {
    return this.state.hidden
  }

  render () {
    if (this.state.hidden) {
      return null
    }

    const { willHide } = this.state
    const { animation } = this.props
    const modalStyle = {
      zIndex: 1050,
      position: 'fixed',
      width: '500px',
      transform: 'translate3d(-50%, -50%, 0)',
      top: '50%',
      left: '50%',
    }
    const backdropStyle = {
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 1040,
      backgroundColor: '#373A47',
      animationFillMode: 'forwards',
      animationDuration: '0.3s',
      animationName: willHide ? animation.hideBackdropAnimation : animation.showBackdropAnimation,
      animationTimingFunction: (willHide ? animation.hide : animation.show).animationTimingFunction,
    }
    const contentStyle = {
      margin: 0,
      backgroundColor: 'white',
      animationDuration: (willHide ? animation.hide : animation.show).animationDuration,
      animationFillMode: 'forwards',
      animationName: willHide ? animation.hideContentAnimation : animation.showContentAnimation,
      animationTimingFunction: (willHide ? animation.hide : animation.show).animationTimingFunction,
    }

    // Apply custom style properties
    if (this.props.modalStyle) {
      var prefixedModalStyle = this.props.modalStyle
      for (const style in prefixedModalStyle) {
        modalStyle[style] = prefixedModalStyle[style]
      }
    }

    if (this.props.backdropStyle) {
      const prefixedBackdropStyle = this.props.backdropStyle
      for (const style in prefixedBackdropStyle) {
        backdropStyle[style] = prefixedBackdropStyle[style]
      }
    }

    if (this.props.contentStyle) {
      const prefixedContentStyle = this.props.contentStyle
      for (const style in prefixedContentStyle) {
        contentStyle[style] = prefixedContentStyle[style]
      }
    }

    const backdrop = this.props.backdrop ? <div style={backdropStyle} onClick={this.props.closeOnClick ? this.handleBackdropClick : null} /> : undefined

    if (willHide) {
      this.addTransitionListener(this.content, this.leave)
    }

    return (<span>
      <div style={modalStyle} className={this.props.className}>
        <div ref={el => (this.content = el)} tabIndex="-1" style={contentStyle}>
          {this.props.children}
        </div>
      </div>
      {backdrop}
    </span>)

  }

  leave = () => {
    this.setState({
      hidden: true,
    })
    this.props.onHide(this.state.hideSource)
  }

  enter = () => {
    this.props.onShow()
  }

  show = () => {
    if (!this.state.hidden) {
      return
    }

    this.setState({
      willHide: false,
      hidden: false,
    })

    setTimeout(function () {
      this.addTransitionListener(this.content, this.enter)
    }.bind(this), 0)
  }

  hide = () => {
    if (this.hasHidden()) {
      return
    }

    this.setState({
      willHide: true,
    })
  }

  toggle = () => {
    if (this.hasHidden()) {
      this.show()
    } else {
      this.hide()
    }
  }

  listenKeyboard = (event) => {
    if (typeof this.props.keyboard === 'function') {
      this.props.keyboard(event)
    } else {
      this.closeOnEsc(event)
    }
  }

  closeOnEsc = (event) => {
    if (this.props.keyboard &&
      (event.key === 'Escape' ||
        event.keyCode === 27)) {
      this.hide()
    }
  }

  UNSAFE_componentDidMount = () => {
    window.addEventListener('keydown', this.listenKeyboard, true)
  }

  UNSAFE_componentWillUnmount = () => {
    window.removeEventListener('keydown', this.listenKeyboard, true)
  }
}

export default FadeModal