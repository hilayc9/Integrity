/* eslint-disable react/default-props-match-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import {
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
    Text as NativeText,
} from 'react-native';

import TextElement from '../node_modules/react-native-elements/src/text/Text';
import CheckBoxIcon from '../node_modules/react-native-elements/src/checkbox/CheckBoxIcon';
import { fonts, ViewPropTypes, withTheme } from '../node_modules/react-native-elements/src/config';

const MyCheckBox = props => {
    const { theme, ...rest } = props;

    const {
        Component,
        checked,
        iconRight,
        title,
        center,
        right,
        containerStyle,
        textStyle,
        wrapperStyle,
        onPress,
        onLongPress,
        checkedTitle,
        fontFamily,
        checkedColor = theme.colors.primary,
        ...attributes
    } = rest;

    return (
        <Component
            {...attributes}
            onLongPress={onLongPress}
            onPress={onPress}
            style={StyleSheet.flatten([
                styles.container,
                title && styles.containerHasTitle,
                containerStyle && containerStyle,
            ])}
        >
            <View
                style={StyleSheet.flatten([
                    styles.wrapper,
                    right && { justifyContent: 'flex-end' },
                    center && { justifyContent: 'center' },
                    wrapperStyle && wrapperStyle,
                ])}
            >
                {!iconRight && <CheckBoxIcon {...props} checkedColor={checkedColor} />}

                {React.isValidElement(title)
                    ? title
                    : title && (
                    <TextElement
                        testID="checkboxTitle"
                        style={StyleSheet.flatten([
                            styles.text(theme),
                            textStyle && textStyle,
                            fontFamily && { fontFamily },
                        ])}
                    >
                        {checked ? checkedTitle || title : title}
                    </TextElement>
                )}

                {iconRight && <CheckBoxIcon {...props} checkedColor={checkedColor} />}
            </View>
        </Component>
    );
};
MyCheckBox.propTypes = {
    ...CheckBoxIcon.propTypes,
    Component: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    iconRight: PropTypes.bool,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    center: PropTypes.bool,
    right: PropTypes.bool,
    containerStyle: ViewPropTypes.style,
    wrapperStyle: ViewPropTypes.style,
    textStyle: NativeText.propTypes.style,
    onPress: PropTypes.func,
    onLongPress: PropTypes.func,
    checkedTitle: PropTypes.string,
    fontFamily: PropTypes.string,
};

MyCheckBox.defaultProps = {
    checked: false,
    iconRight: false,
    right: false,
    center: false,
    uncheckedColor: '#bfbfbf',
    checkedIcon: 'check-square',
    uncheckedIcon: 'square',
    size: 24,
    Component: TouchableOpacity,
};

const styles = {
    wrapper: {
        flexDirection: 'column', //was: row
        alignItems: 'center',
    },
    container: {
        margin: 0, //was: 5
        marginLeft: 0, //was: 10
        marginRight: 0, //was: 10
        padding: 0, //was: 10
    },
    containerHasTitle: {
        borderWidth: 1,
        borderRadius: 3,
        backgroundColor: 'transparent', //was: #fafafa
        borderColor: 'transparent', //was: #ededed
    },
    text: theme => ({
        marginLeft: 0, //was: 10
        marginRight: 10,
        color: theme.colors.grey1,
        ...Platform.select({
            android: {
                ...fonts.android.bold,
            },
            default: {
                fontWeight: 'bold',
            },
        }),
    }),
};

export { MyCheckBox };
export default withTheme(MyCheckBox, 'MyCheckBox');
